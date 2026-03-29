import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Course, Prisma } from "@prisma/client";
import { TeamService } from "../teams/team.service.js";

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
    return this.prisma.course.create({
      data,
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
    data: { name?: string; distanceTour?: number; dateAndTime?: Date; editionId?: number },
  ): Promise<Course> {
    const hasField =
      data.name !== undefined ||
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
    return this.prisma.course.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.distanceTour !== undefined ? { distanceTour: data.distanceTour } : {}),
        ...(data.dateAndTime !== undefined ? { dateAndTime: data.dateAndTime } : {}),
        ...(data.editionId != null && data.editionId !== existing.editionId
          ? { edition: { connect: { id: data.editionId } } }
          : {}),
      },
    });
  }
}
