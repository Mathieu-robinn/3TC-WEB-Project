import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, Runner } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateRunnerDto, UpdateRunnerDto } from "./dto/runner.dto.js";
import { RunnerService } from "./runner.service.js";
import { EditionService } from "../editions/edition.service.js";

@ApiTags("Runners")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class RunnersController {
  constructor(
    private readonly runnerService: RunnerService,
    private readonly editionService: EditionService,
  ) {}

  @ApiOperation({ summary: "Lister tous les coureurs (public)" })
  @ApiResponse({ status: 200, description: "Liste des coureurs." })
  @Get("runners")
  @Public()
  async getAllRunners() {
    const editionId = await this.editionService.getActiveEditionId();
    return this.runnerService.runnersForActiveEdition(editionId);
  }

  @ApiOperation({ summary: "Créer un nouveau coureur" })
  @ApiBody({ schema: { example: { firstName: "Marie", lastName: "Curie", email: "m.curie@insa.fr", teamId: 1 } } })
  @Post("runner")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async createRunner(@Body() data: CreateRunnerDto): Promise<Runner> {
    const prismaData: Prisma.RunnerCreateInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      ...(data.email ? { email: data.email } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      team: { connect: { id: data.teamId } },
    };
    return this.runnerService.createRunner(prismaData);
  }

  @ApiOperation({ summary: "Mettre à jour un coureur" })
  @ApiParam({ name: "id", description: "ID du coureur" })
  @ApiBody({
    schema: {
      example: { firstName: "Marie", lastName: "Curie", teamId: 1 },
    },
  })
  @Put("runner/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async updateRunner(@Param("id") id: string, @Body() data: UpdateRunnerDto): Promise<Runner> {
    const prismaData: Prisma.RunnerUpdateInput = {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    };
    if (data.teamId !== undefined) {
      prismaData.team = { connect: { id: data.teamId } };
    }
    return this.runnerService.updateRunner({
      where: { id: Number(id) },
      data: prismaData,
    });
  }

  @ApiOperation({ summary: "Supprimer un coureur" })
  @ApiParam({ name: "id", description: "ID du coureur" })
  @Delete("runner/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async deleteRunner(@Param("id") id: string): Promise<Runner> {
    return this.runnerService.deleteRunner({ id: Number(id) });
  }
}

