import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Message, Prisma } from "@prisma/client";

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async message(messageWhereUniqueInput: Prisma.MessageWhereUniqueInput): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: messageWhereUniqueInput,
    });
  }

  async messages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MessageWhereUniqueInput;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
    include?: Prisma.MessageInclude;
  }): Promise<Message[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.message.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    } as any);
  }

  async createMessage(data: Prisma.MessageCreateInput) {
    return this.prisma.message.create({
      data,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateMessage(params: {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.MessageUpdateInput;
  }): Promise<Message> {
    const { where, data } = params;
    return this.prisma.message.update({
      data,
      where,
    });
  }

  async deleteMessage(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.prisma.message.delete({
      where,
    });
  }

  async countMessages(where: Prisma.MessageWhereInput): Promise<number> {
    return this.prisma.message.count({ where });
  }
}
