import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Log, LogType, Prisma, Role } from "@prisma/client";

const userForLogList = {
  select: { id: true, firstName: true, lastName: true, email: true, role: true },
} as const;

export type LogWithUser = Log & {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  };
};

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

  async findPageForAdmin(params: {
    skip: number;
    take: number;
    types?: LogType[];
    userSearch?: string;
    from?: Date;
    to?: Date;
    sort: "asc" | "desc";
  }): Promise<{ items: LogWithUser[]; total: number }> {
    const where: Prisma.LogWhereInput = {};
    if (params.types?.length) {
      where.type = { in: params.types };
    }
    const q = params.userSearch?.trim();
    if (q) {
      where.user = {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      };
    }
    if (params.from || params.to) {
      where.dateTime = {};
      if (params.from) {
        where.dateTime.gte = params.from;
      }
      if (params.to) {
        where.dateTime.lte = params.to;
      }
    }
    const [items, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { dateTime: params.sort },
        include: { user: userForLogList },
      }),
      this.prisma.log.count({ where }),
    ]);
    return { items: items as LogWithUser[], total };
  }

  async findByIdForAdmin(id: number): Promise<LogWithUser | null> {
    const row = await this.prisma.log.findUnique({
      where: { id },
      include: { user: userForLogList },
    });
    return row as LogWithUser | null;
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
