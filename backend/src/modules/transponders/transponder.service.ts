import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Transponder, Prisma } from "@prisma/client";

@Injectable()
export class TransponderService {
  constructor(private prisma: PrismaService) {}

  async transponder(transponderWhereUniqueInput: Prisma.TransponderWhereUniqueInput): Promise<Transponder | null> {
    return this.prisma.transponder.findUnique({
      where: transponderWhereUniqueInput,
    });
  }

  async transponders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TransponderWhereUniqueInput;
    where?: Prisma.TransponderWhereInput;
    orderBy?: Prisma.TransponderOrderByWithRelationInput;
  }): Promise<Transponder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.transponder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createTransponder(data: Prisma.TransponderCreateInput): Promise<Transponder> {
    return this.prisma.transponder.create({
      data,
    });
  }

  async updateTransponder(params: {
    where: Prisma.TransponderWhereUniqueInput;
    data: Prisma.TransponderUpdateInput;
  }): Promise<Transponder> {
    const { where, data } = params;
    return this.prisma.transponder.update({
      data,
      where,
    });
  }

  async deleteTransponder(where: Prisma.TransponderWhereUniqueInput): Promise<Transponder> {
    return this.prisma.transponder.delete({
      where,
    });
  }
}
