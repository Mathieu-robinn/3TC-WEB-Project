import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Course, CourseCategory, Prisma } from "@prisma/client";
import { TeamService } from "../teams/team.service.js";
import {
  courseCategoryLabelFromCourse,
  normalizeCustomCategoryName,
} from "../../common/course-category.util.js";

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private teamService: TeamService,
  ) {}

  async course(courseWhereUniqueInput: Prisma.CourseWhereUniqueInput): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: courseWhereUniqueInput,
    });
  }

  async courses(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CourseWhereUniqueInput;
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithRelationInput;
  }): Promise<Course[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.course.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createCourse(data: Prisma.CourseCreateInput): Promise<Course> {
    const editionConnect = (data.edition as { connect?: { id: number } } | undefined)?.connect;
    const editionId = editionConnect?.id ?? (data as { editionId?: number }).editionId;
    const name = (data.name as string | undefined)?.trim();
    const category = (data as { category?: CourseCategory }).category;
    const rawCustom = (data as { customCategoryName?: string }).customCategoryName;
    if (!name) {
      throw new BadRequestException("Le nom du parcours est requis.");
    }
    if (editionId == null) {
      throw new BadRequestException("editionId requis pour créer un parcours.");
    }
    if (category == null) {
      throw new BadRequestException("La catégorie du parcours est requise.");
    }
    const customCategoryName = normalizeCustomCategoryName(category, rawCustom);

    const existing = await this.prisma.course.findFirst({
      where: {
        editionId,
        category,
        customCategoryName,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un parcours « ${name} » (${courseCategoryLabelFromCourse({ category, customCategoryName })}) existe déjà pour cette édition.`,
      );
    }

    return this.prisma.course.create({
      data: { ...data, name, category, customCategoryName },
    });
  }

  async updateCourse(params: {
    where: Prisma.CourseWhereUniqueInput;
    data: Prisma.CourseUpdateInput;
  }): Promise<Course> {
    const { where, data } = params;
    return this.prisma.course.update({
      data,
      where,
    });
  }

  async deleteCourse(where: Prisma.CourseWhereUniqueInput): Promise<Course> {
    return this.prisma.course.delete({
      where,
    });
  }

  /** Supprime un parcours après suppression des équipes qui y sont rattachées. */
  async deleteCourseCascade(id: number): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { teams: { select: { id: true } } },
    });
    if (!course) {
      throw new NotFoundException(`Parcours #${id} introuvable.`);
    }
    for (const team of course.teams) {
      await this.teamService.deleteTeam({ id: team.id });
    }
    return this.prisma.course.delete({ where: { id } });
  }

  async updateCourseSafe(
    id: number,
    data: {
      name?: string;
      category?: CourseCategory;
      customCategoryName?: string;
      distanceTour?: number;
      dateAndTime?: Date;
      editionId?: number;
    },
  ): Promise<Course> {
    const hasField =
      data.name !== undefined ||
      data.category !== undefined ||
      data.customCategoryName !== undefined ||
      data.distanceTour !== undefined ||
      data.dateAndTime !== undefined ||
      data.editionId !== undefined;
    if (!hasField) {
      throw new BadRequestException("Aucun champ à mettre à jour.");
    }
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Parcours #${id} introuvable.`);
    }
    if (data.editionId != null && data.editionId !== existing.editionId) {
      const edition = await this.prisma.edition.findUnique({ where: { id: data.editionId } });
      if (!edition) {
        throw new BadRequestException(`Édition #${data.editionId} introuvable.`);
      }
    }
    const targetEditionId = data.editionId ?? existing.editionId;
    const targetName = data.name ?? existing.name;
    const targetCategory = data.category ?? existing.category;
    const targetCustom =
      data.customCategoryName !== undefined || data.category !== undefined
        ? normalizeCustomCategoryName(
            targetCategory,
            data.customCategoryName !== undefined
              ? data.customCategoryName
              : existing.customCategoryName,
          )
        : existing.customCategoryName;

    if (
      data.name !== undefined ||
      data.category !== undefined ||
      data.customCategoryName !== undefined ||
      data.editionId !== undefined
    ) {
      const dup = await this.prisma.course.findFirst({
        where: {
          editionId: targetEditionId,
          category: targetCategory,
          customCategoryName: targetCustom,
          name: { equals: targetName, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (dup) {
        throw new ConflictException(
          `Un parcours « ${targetName} » (${courseCategoryLabelFromCourse({ category: targetCategory, customCategoryName: targetCustom })}) existe déjà pour cette édition.`,
        );
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.customCategoryName !== undefined || data.category !== undefined
          ? { customCategoryName: targetCustom }
          : {}),
        ...(data.distanceTour !== undefined ? { distanceTour: data.distanceTour } : {}),
        ...(data.dateAndTime !== undefined ? { dateAndTime: data.dateAndTime } : {}),
        ...(data.editionId != null && data.editionId !== existing.editionId
          ? { edition: { connect: { id: data.editionId } } }
          : {}),
      },
    });
  }
}
