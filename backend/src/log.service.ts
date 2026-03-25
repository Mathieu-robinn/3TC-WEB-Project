import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { Log, Prisma } from "@prisma/client";

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  async log(logWhereUniqueInput: Prisma.LogWhereUniqueInput): Promise<Log | null> {
    return this.prisma.log.findUnique({
      where: logWhereUniqueInput,
    });
  }

  async logs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.LogWhereUniqueInput;
    where?: Prisma.LogWhereInput;
    orderBy?: Prisma.LogOrderByWithRelationInput;
  }): Promise<Log[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.log.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createLog(data: Prisma.LogCreateInput): Promise<Log> {
    return this.prisma.log.create({
      data,
    });
  }

  async updateLog(params: {
    where: Prisma.LogWhereUniqueInput;
    data: Prisma.LogUpdateInput;
  }): Promise<Log> {
    const { where, data } = params;
    return this.prisma.log.update({
      data,
      where,
    });
  }

  async deleteLog(where: Prisma.LogWhereUniqueInput): Promise<Log> {
    return this.prisma.log.delete({
      where,
    });
  }
}
