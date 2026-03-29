import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConversationService } from './conversation.service.js';
import { MessageService } from './message.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { ConversationParticipantService } from './conversation-participant.service.js';
import { UserService } from '../users/user.service.js';

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagingController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly participantService: ConversationParticipantService,
    private readonly eventsGateway: EventsGateway,
    private readonly userService: UserService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users available to start a conversation with' })
  async getChatUsers(@Req() req) {
    const users = await this.userService.users({
      orderBy: { lastName: 'asc' },
    });
    return users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  async getConversations(@Req() req) {
    const userId = req.user.userId;
    // We get conversations where the user is a participant
    return this.conversationService.conversations({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(@Body() dto: CreateConversationDto, @Req() req) {
    const userId = req.user.userId;
    let participantIds = dto.participantIds || [];
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    // Check for existing PRIVATE conversation between same 2 users
    if (dto.type === 'PRIVATE' && participantIds.length === 2) {
      const existing = await this.conversationService.conversations({
        where: {
          type: 'PRIVATE',
          AND: participantIds.map(id => ({
            participants: { some: { userId: id } }
          }))
        },
        include: { participants: true }
      });
      // If a private conversation already exists with exactly these 2 participants, return it
      const exact = (existing as any[]).find(
        (c: any) => c.participants.length === 2
      );
      if (exact) return exact;
    }

    const conversation = await this.conversationService.createConversation({
      name: dto.name,
      type: dto.type,
      createdByUser: { connect: { id: userId } },
      participants: {
        create: participantIds.map((id) => ({
          user: { connect: { id } },
          role: id === userId ? 'ADMIN' : 'MEMBER',
        })),
      },
    });
    return conversation;
  }

  @Patch('conversations/:id/name')
  @ApiOperation({ summary: 'Rename a group conversation (admin only)' })
  async renameConversation(@Param('id') conversationId: string, @Body() body: { name: string }, @Req() req) {
    const userId = req.user.userId;
    const cid = parseInt(conversationId, 10);

    // Check requester is admin
    const participants = await this.participantService.participants({ where: { conversationId: cid } });
    const me = participants.find(p => p.userId === userId);
    if (!me || me.role !== 'ADMIN') throw new ForbiddenException('Seuls les administrateurs peuvent renommer le groupe.');

    const updated = await this.conversationService.updateConversation({
      where: { id: cid },
      data: { name: body.name.trim() },
    });
    return updated;
  }

  @Patch('conversations/:id/participants/:participantId/role')
  @ApiOperation({ summary: 'Promote/demote a participant role (admin only)' })
  async updateParticipantRole(
    @Param('id') conversationId: string,
    @Param('participantId') participantId: string,
    @Body() body: { role: 'ADMIN' | 'MEMBER' },
    @Req() req
  ) {
    const userId = req.user.userId;
    const cid = parseInt(conversationId, 10);
    const pid = parseInt(participantId, 10);

    // Check requester is admin
    const participants = await this.participantService.participants({ where: { conversationId: cid } });
    const me = participants.find(p => p.userId === userId);
    if (!me || me.role !== 'ADMIN') throw new ForbiddenException('Seuls les administrateurs peuvent modifier les rôles.');

    if (!['ADMIN', 'MEMBER'].includes(body.role)) throw new BadRequestException('Rôle invalide.');

    const updated = await this.participantService.updateParticipant({
      where: { id: pid },
      data: { role: body.role },
    });
    return updated;
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(@Param('id') conversationId: string, @Req() req) {
    const userId = req.user.userId;
    const cid = parseInt(conversationId, 10);
    // You could check if user is in conversation first
    return this.messageService.messages({
      where: { conversationId: cid },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async sendMessage(@Param('id') conversationId: string, @Body() dto: SendMessageDto, @Req() req) {
    const userId = req.user.userId;
    const cid = parseInt(conversationId, 10);

    const message = await this.messageService.createMessage({
      content: dto.content,
      messageType: dto.messageType || 'TEXT',
      sender: { connect: { id: userId } },
      conversation: { connect: { id: cid } },
      ...(dto.replyToMessageId && { replyToMessage: { connect: { id: dto.replyToMessageId } } }),
    });

    // Update conversation lastMessageAt
    await this.conversationService.updateConversation({
      where: { id: cid },
      data: { lastMessageAt: new Date() },
    });

    // Fetch real sender info (JWT doesn't carry firstName/lastName)
    const senderUser = await this.userService.user({ id: userId });

    // Emit via WebSocket to active clients
    this.eventsGateway.server.emit(`conversation:${cid}:newMessage`, {
      id: message.id,
      conversationId: cid,
      senderUserId: userId,
      content: message.content,
      messageType: message.messageType,
      createdAt: message.createdAt,
      sender: {
        id: userId,
        email: senderUser?.email ?? '',
        firstName: senderUser?.firstName ?? '',
        lastName: senderUser?.lastName ?? '',
      }
    });

    return message;
  }
}
