import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, Team } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateTeamDto, UpdateTeamDto } from "./dto/team.dto.js";
import { TeamService } from "./team.service.js";
import { EditionService } from "../editions/edition.service.js";

@ApiTags("Teams")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TeamsController {
  constructor(
    private readonly teamService: TeamService,
    private readonly editionService: EditionService,
  ) {}

  @ApiOperation({ summary: "Lister toutes les équipes (public)" })
  @ApiResponse({ status: 200, description: "Liste des équipes." })
  @Get("teams")
  @Public()
  async getAllTeams() {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      return [];
    }
    return this.teamService.teamsWithRunners({
      where: { course: { editionId } },
    });
  }

  @ApiOperation({ summary: "Classement des équipes par nombre de tours (public)" })
  @ApiResponse({ status: 200, description: "Équipes triées par nbTour décroissant." })
  @Get("teams/ranking")
  @Public()
  async getTeamRanking(): Promise<Team[]> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      return [];
    }
    return this.teamService.teams({
      where: { course: { editionId } },
      orderBy: { nbTour: "desc" },
    });
  }

  @ApiOperation({ summary: "Créer une équipe" })
  @ApiBody({ schema: { example: { num: 99, name: "Nouvelle Équipe", courseId: 1 } } })
  @Post("team")
  @Roles(Role.ADMIN)
  async createTeam(@Body() data: CreateTeamDto): Promise<Team> {
    const prismaData: Prisma.TeamCreateInput = {
      num: data.num,
      name: data.name,
      course: { connect: { id: data.courseId } },
    };
    return this.teamService.createTeam(prismaData);
  }

  @ApiOperation({ summary: "Mettre à jour une équipe (ex: nbTour)" })
  @ApiParam({ name: "id", description: "ID de l'équipe" })
  @ApiBody({ schema: { example: { nbTour: 230 } } })
  @Put("team/:id")
  @Roles(Role.ADMIN)
  async updateTeam(@Param("id") id: string, @Body() data: UpdateTeamDto): Promise<Team> {
    const prismaData: Prisma.TeamUpdateInput = {
      ...(data.num !== undefined ? { num: data.num } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.nbTour !== undefined ? { nbTour: data.nbTour } : {}),
      ...(data.respRunnerId !== undefined ? { respRunnerId: data.respRunnerId } : {}),
    };
    return this.teamService.updateTeam({ where: { id: Number(id) }, data: prismaData });
  }

  @ApiOperation({ summary: "Supprimer une équipe" })
  @ApiParam({ name: "id", description: "ID de l'équipe" })
  @Delete("team/:id")
  @Roles(Role.ADMIN)
  async deleteTeam(@Param("id") id: string): Promise<Team> {
    return this.teamService.deleteTeam({ id: Number(id) });
  }
}

