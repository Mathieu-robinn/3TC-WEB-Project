import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { Runner, Prisma } from "@prisma/client";

@Injectable()
export class RunnerService {
  constructor(private prisma: PrismaService) {}

  async runner(runnerWhereUniqueInput: Prisma.RunnerWhereUniqueInput): Promise<Runner | null> {
    return this.prisma.runner.findUnique({
      where: runnerWhereUniqueInput,
    });
  }

  async runners(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RunnerWhereUniqueInput;
    where?: Prisma.RunnerWhereInput;
    orderBy?: Prisma.RunnerOrderByWithRelationInput;
  }): Promise<Runner[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.runner.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRunner(data: Prisma.RunnerCreateInput): Promise<Runner> {
    return this.prisma.runner.create({
      data,
    });
  }

  async updateRunner(params: {
    where: Prisma.RunnerWhereUniqueInput;
    data: Prisma.RunnerUpdateInput;
  }): Promise<Runner> {
    const { where, data } = params;
    return this.prisma.runner.update({
      data,
      where,
    });
  }

  async deleteRunner(where: Prisma.RunnerWhereUniqueInput): Promise<Runner> {
    return this.prisma.runner.delete({
      where,
    });
  }
}
