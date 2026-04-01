import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
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

  /**
   * Coureurs des équipes de l’édition active, avec transpondeurs de l’équipe pour l’UI.
   */
  async runnersForActiveEdition(editionId: number | null) {
    if (editionId == null) {
      return [];
    }
    const rows = await this.prisma.runner.findMany({
      where: { team: { course: { editionId } } },
      include: {
        team: { include: { transponders: true } },
      },
    });
    return rows.map((r) => ({
      ...r,
      transponders: r.team?.transponders ?? [],
    }));
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
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.runner.findUnique({ where });
      if (!existing) {
        throw new NotFoundException(`Coureur introuvable.`);
      }
      const connect = (data.team as { connect?: { id: number } } | undefined)?.connect;
      const newTeamId = connect?.id;
      if (newTeamId !== undefined && newTeamId !== existing.teamId) {
        const oldTeam = await tx.team.findUnique({ where: { id: existing.teamId } });
        if (oldTeam) {
          const patch: Prisma.TeamUncheckedUpdateInput = {};
          if (oldTeam.respRunnerId === existing.id) {
            patch.respRunnerId = null;
          }
          if (oldTeam.transponderHolderRunnerId === existing.id) {
            patch.transponderHolderRunnerId = null;
          }
          if (Object.keys(patch).length > 0) {
            await tx.team.update({ where: { id: oldTeam.id }, data: patch });
          }
        }
      }
      return tx.runner.update({
        data,
        where,
      });
    });
  }

  async deleteRunner(where: Prisma.RunnerWhereUniqueInput): Promise<Runner> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.runner.findUnique({ where });
      if (!existing) {
        throw new NotFoundException(`Coureur introuvable.`);
      }
      const team = await tx.team.findUnique({ where: { id: existing.teamId } });
      if (team) {
        const patch: Prisma.TeamUncheckedUpdateInput = {};
        if (team.respRunnerId === existing.id) {
          patch.respRunnerId = null;
        }
        if (team.transponderHolderRunnerId === existing.id) {
          patch.transponderHolderRunnerId = null;
        }
        if (Object.keys(patch).length > 0) {
          await tx.team.update({ where: { id: team.id }, data: patch });
        }
      }
      return tx.runner.delete({ where });
    });
  }
}
