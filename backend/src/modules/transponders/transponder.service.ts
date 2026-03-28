import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Transponder, Prisma } from "@prisma/client";

@Injectable()
export class TransponderService {
  constructor(private prisma: PrismaService) { }

  async transponder(transponderWhereUniqueInput: Prisma.TransponderWhereUniqueInput): Promise<Transponder | null> {
    return this.prisma.transponder.findUnique({
      where: transponderWhereUniqueInput,
      include: { team: true },
    });
  }

  async transponders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TransponderWhereUniqueInput;
    where?: Prisma.TransponderWhereInput;
    orderBy?: Prisma.TransponderOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.transponder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { team: true },
    });
  }

  /**
   * Retourne les équipes qui n'ont pas de transpondeur actif (pas de transpondeur avec status OUT)
   * ou qui ont perdu leur transpondeur (tous leurs transpondeurs sont LOST).
   */
  async teamsWithoutActiveTransponder() {
    const teams = await this.prisma.team.findMany({
      include: {
        transponders: true,
      },
    });

    return teams.filter((team) => {
      // Transpondeurs directement liés à l'équipe
      if (team.respRunnerId == null) return false;
      const teamActiveTransponders = team.transponders.filter(
        (t) => t.status === "ATTRIBUE" || t.status === "RECUPERE"
      );
      if (teamActiveTransponders.length > 0) return false;
      return true;
    });
  }

  async createTransponder(data: Prisma.TransponderCreateInput): Promise<Transponder> {
    return this.prisma.transponder.create({
      data,
      include: { team: true },
    });
  }

  async updateTransponder(params: {
    where: Prisma.TransponderWhereUniqueInput;
    data: Prisma.TransponderUpdateInput;
  }) {
    const { where, data } = params;
    return this.prisma.transponder.update({
      data,
      where,
      include: { team: true },
    });
  }

  /**
   * Met à jour un transpondeur via ses champs scalaires directement
   * (teamId, runnerId, status) sans passer par les opérations de relation Prisma
   * (connect/disconnect), ce qui évite les erreurs sur des relations déjà nulles.
   */
  async updateTransponderFields(
    id: number,
    fields: { status?: string; teamId?: number | null },
  ) {
    return this.prisma.transponder.update({
      where: { id },
      data: {
        ...(fields.status !== undefined ? { status: fields.status as any } : {}),
        ...(fields.teamId !== undefined ? { teamId: fields.teamId } : {}),
      },
      include: { team: true },
    });
  }

  async deleteTransponder(where: Prisma.TransponderWhereUniqueInput): Promise<Transponder> {
    return this.prisma.transponder.delete({
      where,
    });
  }
}
