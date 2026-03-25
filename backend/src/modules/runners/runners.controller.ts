import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, Runner } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateRunnerDto } from "./dto/runner.dto.js";
import { RunnerService } from "./runner.service.js";

@ApiTags("Runners")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class RunnersController {
  constructor(private readonly runnerService: RunnerService) {}

  @ApiOperation({ summary: "Lister tous les coureurs (public)" })
  @ApiResponse({ status: 200, description: "Liste des coureurs." })
  @Get("runners")
  @Public()
  async getAllRunners(): Promise<Runner[]> {
    return this.runnerService.runners({});
  }

  @ApiOperation({ summary: "Créer un nouveau coureur" })
  @ApiBody({ schema: { example: { firstName: "Marie", lastName: "Curie", email: "m.curie@insa.fr", teamId: 1 } } })
  @Post("runner")
  @Roles(Role.ADMIN, Role.ORGA, Role.BENEVOLE)
  async createRunner(@Body() data: CreateRunnerDto): Promise<Runner> {
    const prismaData: Prisma.RunnerCreateInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      ...(data.email ? { email: data.email } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
    };
    return this.runnerService.createRunner(prismaData);
  }

  @ApiOperation({ summary: "Supprimer un coureur" })
  @ApiParam({ name: "id", description: "ID du coureur" })
  @Delete("runner/:id")
  @Roles(Role.ADMIN, Role.ORGA, Role.BENEVOLE)
  async deleteRunner(@Param("id") id: string): Promise<Runner> {
    return this.runnerService.deleteRunner({ id: Number(id) });
  }
}

