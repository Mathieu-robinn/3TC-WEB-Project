import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Conversation, Prisma } from "@prisma/client";

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async conversation(conversationWhereUniqueInput: Prisma.ConversationWhereUniqueInput): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: conversationWhereUniqueInput,
    });
  }

  async conversations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConversationWhereUniqueInput;
    where?: Prisma.ConversationWhereInput;
    orderBy?: Prisma.ConversationOrderByWithRelationInput;
    include?: Prisma.ConversationInclude;
  }): Promise<Conversation[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.conversation.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    } as any);
  }

  async createConversation(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return this.prisma.conversation.create({
      data,
    });
  }

  async updateConversation(params: {
    where: Prisma.ConversationWhereUniqueInput;
    data: Prisma.ConversationUpdateInput;
  }): Promise<Conversation> {
    const { where, data } = params;
    return this.prisma.conversation.update({
      data,
      where,
    });
  }

  async deleteConversation(where: Prisma.ConversationWhereUniqueInput): Promise<Conversation> {
    return this.prisma.conversation.delete({
      where,
    });
  }
}
