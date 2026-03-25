import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Course, Prisma, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateCourseDto } from "./dto/course.dto.js";
import { CourseService } from "./course.service.js";

@ApiTags("Courses")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class CoursesController {
  constructor(private readonly courseService: CourseService) {}

  @ApiOperation({ summary: "Lister tous les parcours (public)" })
  @ApiResponse({ status: 200, description: "Liste des parcours." })
  @Get("courses")
  @Public()
  async getAllCourses(): Promise<Course[]> {
    return this.courseService.courses({});
  }

  @ApiOperation({ summary: "Créer un nouveau parcours" })
  @ApiBody({ schema: { example: { name: "12 Heures", distanceTour: 2.5, dateAndTime: "2026-05-16T20:00:00Z", editionId: 1 } } })
  @ApiResponse({ status: 201, description: "Parcours créé." })
  @Post("course")
  @Roles(Role.ADMIN, Role.ORGA)
  async createCourse(@Body() data: CreateCourseDto): Promise<Course> {
    const prismaData: Prisma.CourseCreateInput = {
      name: data.name,
      distanceTour: data.distanceTour,
      dateAndTime: data.dateAndTime,
      edition: { connect: { id: data.editionId } },
    };
    return this.courseService.createCourse(prismaData);
  }
}

