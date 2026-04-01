import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Edition, Prisma } from "@prisma/client";
import { TeamService } from "../teams/team.service.js";

@Injectable()
export class EditionService {
  constructor(
    private prisma: PrismaService,
    private teamService: TeamService,
  ) {}

  /**
   * Édition utilisée pour filtrer équipes / coureurs / etc.
   * Priorité : édition `active: true` **qui a au moins un parcours** ; sinon la plus récente (`startDate`)
   * parmi les éditions qui ont des parcours (sinon listes toujours vides si l’active n’a pas encore de `Course`).
   */
  async getActiveEditionId(): Promise<number | null> {
    const ordered = await this.prisma.edition.findMany({
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      include: { _count: { select: { courses: true } } },
    });
    if (ordered.length === 0) {
      return null;
    }
    const active = ordered.find((e) => e.active);
    if (active && active._count.courses > 0) {
      return active.id;
    }
    const withCourses = ordered.find((e) => e._count.courses > 0);
    return withCourses?.id ?? null;
  }

  /** Une seule édition active à la fois. */
  async setActiveEdition(id: number): Promise<Edition> {
    const exists = await this.prisma.edition.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Édition #${id} introuvable.`);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.edition.updateMany({ data: { active: false } });
      return tx.edition.update({ where: { id }, data: { active: true } });
    });
  }

  async edition(editionWhereUniqueInput: Prisma.EditionWhereUniqueInput): Promise<Edition | null> {
    return this.prisma.edition.findUnique({
      where: editionWhereUniqueInput,
    });
  }

  async editions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.EditionWhereUniqueInput;
    where?: Prisma.EditionWhereInput;
    orderBy?: Prisma.EditionOrderByWithRelationInput;
  }): Promise<Edition[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.edition.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createEdition(data: Prisma.EditionCreateInput): Promise<Edition> {
    return this.prisma.edition.create({
      data,
    });
  }

  async updateEdition(params: {
    where: Prisma.EditionWhereUniqueInput;
    data: Prisma.EditionUpdateInput;
  }): Promise<Edition> {
    const { where, data } = params;
    return this.prisma.edition.update({
      data,
      where,
    });
  }

  async deleteEdition(where: Prisma.EditionWhereUniqueInput): Promise<Edition> {
    return this.prisma.edition.delete({
      where,
    });
  }

  /**
   * Supprime une édition après avoir supprimé toutes les équipes (et données liées) de ses courses.
   * Les transpondeurs rattachés à l’édition sont supprimés en cascade côté Prisma.
   */
  async deleteEditionCascade(id: number): Promise<Edition> {
    const edition = await this.prisma.edition.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            teams: { select: { id: true } },
          },
        },
      },
    });
    if (!edition) {
      throw new NotFoundException(`Édition #${id} introuvable.`);
    }
    for (const course of edition.courses) {
      for (const team of course.teams) {
        await this.teamService.deleteTeam({ id: team.id });
      }
    }
    return this.prisma.edition.delete({ where: { id } });
  }

  async updateEditionSafe(
    id: number,
    data: { name?: string; startDate?: Date; endDate?: Date },
  ): Promise<Edition> {
    const hasField =
      data.name !== undefined || data.startDate !== undefined || data.endDate !== undefined;
    if (!hasField) {
      throw new BadRequestException("Aucun champ à mettre à jour.");
    }
    const existing = await this.prisma.edition.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Édition #${id} introuvable.`);
    }
    const start = data.startDate ?? existing.startDate;
    const end = data.endDate ?? existing.endDate;
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException("La date de fin doit être après la date de début.");
    }
    return this.prisma.edition.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      },
    });
  }
}
