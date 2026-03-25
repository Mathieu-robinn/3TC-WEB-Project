import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { ConversationParticipant, Prisma } from "@prisma/client";

@Injectable()
export class ConversationParticipantService {
  constructor(private prisma: PrismaService) {}

  async participant(participantWhereUniqueInput: Prisma.ConversationParticipantWhereUniqueInput): Promise<ConversationParticipant | null> {
    return this.prisma.conversationParticipant.findUnique({
      where: participantWhereUniqueInput,
    });
  }

  async participants(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConversationParticipantWhereUniqueInput;
    where?: Prisma.ConversationParticipantWhereInput;
    orderBy?: Prisma.ConversationParticipantOrderByWithRelationInput;
  }): Promise<ConversationParticipant[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.conversationParticipant.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createParticipant(data: Prisma.ConversationParticipantCreateInput): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.create({
      data,
    });
  }

  async updateParticipant(params: {
    where: Prisma.ConversationParticipantWhereUniqueInput;
    data: Prisma.ConversationParticipantUpdateInput;
  }): Promise<ConversationParticipant> {
    const { where, data } = params;
    return this.prisma.conversationParticipant.update({
      data,
      where,
    });
  }

  async deleteParticipant(where: Prisma.ConversationParticipantWhereUniqueInput): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.delete({
      where,
    });
  }
}
