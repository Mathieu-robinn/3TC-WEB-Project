import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Course, Prisma, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateCourseDto, UpdateCourseDto } from "./dto/course.dto.js";
import { CourseService } from "./course.service.js";
import { EditionService } from "../editions/edition.service.js";

@ApiTags("Courses")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class CoursesController {
  constructor(
    private readonly courseService: CourseService,
    private readonly editionService: EditionService,
  ) {}

  @ApiOperation({ summary: "Lister tous les parcours (public)" })
  @ApiResponse({ status: 200, description: "Liste des parcours." })
  @Get("courses")
  @Public()
  async getAllCourses(): Promise<Course[]> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      return [];
    }
    return this.courseService.courses({ where: { editionId } });
  }

  @ApiOperation({ summary: "Lister les parcours d’une édition (admin)" })
  @ApiParam({ name: "editionId", description: "ID de l’édition" })
  @ApiResponse({ status: 200, description: "Liste des parcours de l’édition." })
  @Get("edition/:editionId/courses")
  @Roles(Role.ADMIN)
  async getCoursesByEdition(@Param("editionId") editionId: string): Promise<Course[]> {
    const id = Number(editionId);
    return this.courseService.courses({
      where: { editionId: id },
      orderBy: { dateAndTime: "asc" },
    });
  }

  @ApiOperation({ summary: "Créer un nouveau parcours" })
  @ApiBody({ schema: { example: { name: "12 Heures", distanceTour: 2.5, dateAndTime: "2026-05-16T20:00:00Z", editionId: 1 } } })
  @ApiResponse({ status: 201, description: "Parcours créé." })
  @Post("course")
  @Roles(Role.ADMIN)
  async createCourse(@Body() data: CreateCourseDto): Promise<Course> {
    const prismaData: Prisma.CourseCreateInput = {
      name: data.name,
      distanceTour: data.distanceTour,
      dateAndTime: data.dateAndTime,
      edition: { connect: { id: data.editionId } },
    };
    return this.courseService.createCourse(prismaData);
  }

  @ApiOperation({ summary: "Modifier un parcours (admin)" })
  @ApiParam({ name: "id", description: "ID du parcours" })
  @ApiResponse({ status: 200, description: "Parcours mis à jour." })
  @Put("course/:id")
  @Roles(Role.ADMIN)
  async updateCourse(@Param("id") id: string, @Body() data: UpdateCourseDto): Promise<Course> {
    return this.courseService.updateCourseSafe(Number(id), {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.distanceTour !== undefined ? { distanceTour: data.distanceTour } : {}),
      ...(data.dateAndTime !== undefined ? { dateAndTime: data.dateAndTime } : {}),
      ...(data.editionId !== undefined ? { editionId: data.editionId } : {}),
    });
  }

  @ApiOperation({
    summary: "Supprimer un parcours (admin)",
    description: "Supprime d’abord les équipes rattachées à ce parcours, puis le parcours.",
  })
  @ApiParam({ name: "id", description: "ID du parcours" })
  @ApiResponse({ status: 200, description: "Parcours supprimé." })
  @Delete("course/:id")
  @Roles(Role.ADMIN)
  async deleteCourse(@Param("id") id: string): Promise<Course> {
    return this.courseService.deleteCourseCascade(Number(id));
  }
}

