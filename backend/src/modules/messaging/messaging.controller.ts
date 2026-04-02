import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConversationService } from './conversation.service.js';
import { MessageService } from './message.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { ConversationParticipantService } from './conversation-participant.service.js';
import { UserService } from '../users/user.service.js';

function isOrgMessagingAdmin(role: Role | undefined): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

type ConversationWithParticipants = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      include: { user: { select: { id: true; firstName: true; lastName: true; email: true } } };
    };
  };
}>;

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
    const conversations = (await this.conversationService.conversations({
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
    })) as ConversationWithParticipants[];

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const me = conv.participants.find((p) => p.userId === userId);
        const lastRead = me?.lastReadMessageId ?? null;
        const where: Prisma.MessageWhereInput = {
          conversationId: conv.id,
          senderUserId: { not: userId },
          ...(lastRead != null ? { id: { gt: lastRead } } : {}),
        };
        const unreadCount = await this.messageService.countMessages(where);
        return { ...conv, unreadCount };
      })
    );
    return withUnread;
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(@Body() dto: CreateConversationDto, @Req() req) {
    const userId = req.user.userId;
    const me = await this.userService.user({ id: userId });
    if (!me || !isOrgMessagingAdmin(me.role)) {
      throw new ForbiddenException('Seuls les administrateurs peuvent créer des conversations.');
    }
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
      const exact = (existing as any[]).find(
        (c: any) => c.participants.length === 2
      );
      if (exact) {
        throw new ConflictException('Vous avez déjà une conversation avec cette personne.');
      }
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

    for (const participantId of participantIds) {
      this.eventsGateway.emitToUser(participantId, 'conversation:created', {
        conversationId: conversation.id,
      });
    }

    return conversation;
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read up to the latest message' })
  async markConversationRead(@Param('id') conversationId: string, @Req() req) {
    const userId = req.user.userId;
    const cid = parseInt(conversationId, 10);
    const participants = await this.participantService.participants({ where: { conversationId: cid, userId } });
    const me = participants[0];
    if (!me) throw new ForbiddenException('Vous ne participez pas à cette conversation.');

    const lastMsgs = await this.messageService.messages({
      where: { conversationId: cid },
      orderBy: { id: 'desc' },
      take: 1,
    });
    const lastId = lastMsgs[0]?.id;
    if (lastId === undefined) {
      return { ok: true, lastReadMessageId: null as number | null };
    }
    await this.participantService.updateParticipant({
      where: { id: me.id },
      data: { lastReadMessageId: lastId },
    });
    return { ok: true, lastReadMessageId: lastId };
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

  @Post('conversations/:id/participants')
  @ApiOperation({ summary: 'Add participant to a group conversation (admin only)' })
  async addParticipantToGroupConversation(
    @Param('id') conversationId: string,
    @Body() body: { userId: number },
    @Req() req
  ) {
    const requesterUserId = req.user.userId;
    const cid = parseInt(conversationId, 10);
    const targetUserId = Number(body.userId);

    if (!Number.isFinite(cid) || cid <= 0) throw new BadRequestException('Conversation invalide.');
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) throw new BadRequestException('Utilisateur invalide.');

    const conversation = await this.conversationService.conversation({ id: cid });
    if (!conversation) throw new BadRequestException('Conversation introuvable.');
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Seules les conversations groupées peuvent être modifiées.');
    }

    // Check requester is admin of this conversation
    const participants = await this.participantService.participants({ where: { conversationId: cid } });
    const me = participants.find((p) => p.userId === requesterUserId);
    if (!me || me.role !== 'ADMIN') {
      throw new ForbiddenException('Seuls les administrateurs de la conversation peuvent ajouter des participants.');
    }

    // Prevent duplicates (there is no unique constraint on (userId, conversationId))
    const existing = await this.participantService.participants({
      where: { conversationId: cid, userId: targetUserId },
    });
    if (existing.length > 0) {
      throw new ConflictException('Cet utilisateur fait déjà partie de la conversation.');
    }

    // If we don't set lastReadMessageId, the new participant will consider all past messages as unread.
    const lastMsgs = await this.messageService.messages({
      where: { conversationId: cid },
      orderBy: { id: 'desc' },
      take: 1,
    });
    const lastReadMessageId = lastMsgs[0]?.id ?? null;

    await this.participantService.createParticipant({
      user: { connect: { id: targetUserId } },
      conversation: { connect: { id: cid } },
      role: 'MEMBER',
      joinedAt: new Date(),
      ...(lastReadMessageId != null ? { lastReadMessageId } : {}),
    });

    return { ok: true };
  }

  @Delete('conversations/:id/participants/:participantId')
  @ApiOperation({ summary: 'Remove participant from a group conversation (admin only)' })
  async removeParticipantFromGroupConversation(
    @Param('id') conversationId: string,
    @Param('participantId') participantId: string,
    @Req() req
  ) {
    const requesterUserId = req.user.userId;
    const cid = parseInt(conversationId, 10);
    const pid = parseInt(participantId, 10);

    if (!Number.isFinite(cid) || cid <= 0) throw new BadRequestException('Conversation invalide.');
    if (!Number.isFinite(pid) || pid <= 0) throw new BadRequestException('Participant invalide.');

    const conversation = await this.conversationService.conversation({ id: cid });
    if (!conversation) throw new BadRequestException('Conversation introuvable.');
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Seules les conversations groupées peuvent être modifiées.');
    }

    // Check requester is admin of this conversation
    const participants = await this.participantService.participants({ where: { conversationId: cid } });
    const me = participants.find((p) => p.userId === requesterUserId);
    if (!me || me.role !== 'ADMIN') {
      throw new ForbiddenException('Seuls les administrateurs de la conversation peuvent retirer des participants.');
    }

    const participant = await this.participantService.participant({ id: pid });
    if (!participant || participant.conversationId !== cid) {
      throw new BadRequestException('Participant invalide.');
    }

    await this.participantService.deleteParticipant({ id: pid });
    return { ok: true };
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

    // Un seul événement global : le client route par conversationId (évite N listeners par conversation).
    const wsPayload = {
      id: message.id,
      conversationId: cid,
      senderUserId: userId,
      content: message.content,
      messageType: message.messageType,
      createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
      sender: {
        id: userId,
        email: senderUser?.email ?? '',
        firstName: senderUser?.firstName ?? '',
        lastName: senderUser?.lastName ?? '',
      },
    };
    this.eventsGateway.server.emit('conversationNewMessage', wsPayload);

    return message;
  }
}
