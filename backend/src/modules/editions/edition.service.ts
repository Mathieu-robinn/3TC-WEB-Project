import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Edition, Prisma } from "@prisma/client";

@Injectable()
export class EditionService {
  constructor(private prisma: PrismaService) {}

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
}
