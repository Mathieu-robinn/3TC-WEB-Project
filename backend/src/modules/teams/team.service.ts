import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Prisma, Team, TransponderStatus } from "@prisma/client";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async team(teamWhereUniqueInput: Prisma.TeamWhereUniqueInput): Promise<Team | null> {
    return this.prisma.team.findUnique({
      where: teamWhereUniqueInput,
    });
  }

  async teams(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TeamWhereUniqueInput;
    where?: Prisma.TeamWhereInput;
    orderBy?: Prisma.TeamOrderByWithRelationInput;
  }): Promise<Team[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.team.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  /** Liste équipes avec coureurs et transpondeurs (pages admin / détail). */
  async teamsWithRunners(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TeamWhereInput;
    orderBy?: Prisma.TeamOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.team.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        runners: true,
        transponders: true,
      },
    });
  }

  async createTeam(data: Prisma.TeamCreateInput): Promise<Team> {
    return this.prisma.team.create({
      data,
    });
  }

  async updateTeam(params: {
    where: Prisma.TeamWhereUniqueInput;
    data: Prisma.TeamUpdateInput;
  }): Promise<Team> {
    const { where, data } = params;
    const team = await this.prisma.team.findUnique({ where });
    if (!team) {
      throw new NotFoundException(`Équipe introuvable.`);
    }
    const respPatch = (data as { respRunnerId?: number | null }).respRunnerId;
    if (respPatch !== undefined) {
      if (respPatch !== null) {
        const runner = await this.prisma.runner.findUnique({ where: { id: respPatch } });
        if (!runner || runner.teamId !== team.id) {
          throw new BadRequestException("Le capitaine doit être un coureur de cette équipe.");
        }
      }
    }
    return this.prisma.team.update({
      data,
      where,
    });
  }

  async deleteTeam(where: Prisma.TeamWhereUniqueInput): Promise<Team> {
    const existing = await this.prisma.team.findUnique({ where });
    if (!existing) {
      throw new NotFoundException(`Équipe introuvable.`);
    }
    const id = existing.id;
    return this.prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id },
        data: { respRunnerId: null, transponderHolderRunnerId: null },
      });
      await tx.transponder.updateMany({
        where: { teamId: id, status: TransponderStatus.ATTRIBUE },
        data: { teamId: null, status: TransponderStatus.EN_ATTENTE },
      });
      await tx.transponder.updateMany({
        where: { teamId: id },
        data: { teamId: null },
      });
      await tx.runner.deleteMany({ where: { teamId: id } });
      return tx.team.delete({ where: { id } });
    });
  }
}
