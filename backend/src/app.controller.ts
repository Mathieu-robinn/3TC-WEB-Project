import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { UserService } from "./user.service.js";
import { EditionService } from "./edition.service.js";
import { CourseService } from "./course.service.js";
import { TeamService } from "./team.service.js";
import { RunnerService } from "./runner.service.js";
import { TransponderService } from "./transponder.service.js";
import { TransponderTransactionService } from "./transponder-transaction.service.js";
import { JwtAuthGuard } from "./auth/jwt-auth.guard.js";
import { Public } from "./auth/public.decorator.js";
import { User, Edition, Course, Team, Runner, Transponder, TransponderTransaction, Prisma } from "@prisma/client";

/**
 * AppController : Point d'entrée principal de l'API REST.
 * Toutes les routes sont protégées par le JwtAuthGuard sauf celles marquées @Public().
 */
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly editionService: EditionService,
    private readonly courseService: CourseService,
    private readonly teamService: TeamService,
    private readonly runnerService: RunnerService,
    private readonly transponderService: TransponderService,
    private readonly transactionService: TransponderTransactionService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Users")
  @ApiOperation({ summary: "Récupérer un utilisateur par ID" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur", example: 1 })
  @ApiResponse({ status: 200, description: "Utilisateur trouvé." })
  @ApiResponse({ status: 401, description: "Non authentifié." })
  @Get("user/:id")
  async getUserById(@Param("id") id: string): Promise<User | null> {
    return this.userService.user({ id: Number(id) });
  }

  @ApiTags("Users")
  @ApiOperation({ summary: "Créer un utilisateur (public — pour le provisioning OIDC)" })
  @ApiBody({ schema: { example: { email: "user@example.com", password: "...", firstName: "Jean", lastName: "Dupont", role: "USER" } } })
  @ApiResponse({ status: 201, description: "Utilisateur créé." })
  @Post("user")
  @Public()
  async signupUser(@Body() userData: Prisma.UserCreateInput): Promise<User> {
    return this.userService.createUser(userData);
  }

  @ApiTags("Users")
  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur mis à jour." })
  @Put("user/:id")
  async updateUser(@Param("id") id: string, @Body() userData: Prisma.UserUpdateInput): Promise<User> {
    return this.userService.updateUser({ where: { id: Number(id) }, data: userData });
  }

  @ApiTags("Users")
  @ApiOperation({ summary: "Supprimer un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur supprimé." })
  @Delete("user/:id")
  async deleteUser(@Param("id") id: string): Promise<User> {
    return this.userService.deleteUser({ id: Number(id) });
  }

  // ══════════════════════════════════════════════════════════════════════
  // EDITIONS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Editions")
  @ApiOperation({ summary: "Lister toutes les éditions (public)" })
  @ApiResponse({ status: 200, description: "Liste des éditions." })
  @Get("editions")
  @Public()
  async getAllEditions(): Promise<Edition[]> {
    return this.editionService.editions({});
  }

  @ApiTags("Editions")
  @ApiOperation({ summary: "Créer une nouvelle édition" })
  @ApiBody({ schema: { example: { name: "24h INSA 2027", active: false, startDate: "2027-05-15T18:00:00Z", endDate: "2027-05-17T18:00:00Z" } } })
  @ApiResponse({ status: 201, description: "Édition créée." })
  @Post("edition")
  async createEdition(@Body() data: Prisma.EditionCreateInput): Promise<Edition> {
    return this.editionService.createEdition(data);
  }

  // ══════════════════════════════════════════════════════════════════════
  // COURSES
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Courses")
  @ApiOperation({ summary: "Lister tous les parcours (public)" })
  @ApiResponse({ status: 200, description: "Liste des parcours." })
  @Get("courses")
  @Public()
  async getAllCourses(): Promise<Course[]> {
    return this.courseService.courses({});
  }

  @ApiTags("Courses")
  @ApiOperation({ summary: "Créer un nouveau parcours" })
  @ApiBody({ schema: { example: { name: "12 Heures", distanceTour: 2.5, dateAndTime: "2026-05-16T20:00:00Z", edition: { connect: { id: 1 } } } } })
  @ApiResponse({ status: 201, description: "Parcours créé." })
  @Post("course")
  async createCourse(@Body() data: Prisma.CourseCreateInput): Promise<Course> {
    return this.courseService.createCourse(data);
  }

  // ══════════════════════════════════════════════════════════════════════
  // TEAMS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Teams")
  @ApiOperation({ summary: "Lister toutes les équipes (public)" })
  @ApiResponse({ status: 200, description: "Liste des équipes." })
  @Get("teams")
  @Public()
  async getAllTeams(): Promise<Team[]> {
    return this.teamService.teams({});
  }

  @ApiTags("Teams")
  @ApiOperation({ summary: "Classement des équipes par nombre de tours (public)" })
  @ApiResponse({ status: 200, description: "Équipes triées par nbTour décroissant." })
  @Get("teams/ranking")
  @Public()
  async getTeamRanking(): Promise<Team[]> {
    return this.teamService.teams({ where: { nbTour: { not: null } }, orderBy: { nbTour: "desc" } });
  }

  @ApiTags("Teams")
  @ApiOperation({ summary: "Créer une équipe" })
  @ApiBody({ schema: { example: { num: 99, name: "Nouvelle Équipe", courseId: 1 } } })
  @Post("team")
  async createTeam(@Body() data: Prisma.TeamCreateInput): Promise<Team> {
    return this.teamService.createTeam(data);
  }

  @ApiTags("Teams")
  @ApiOperation({ summary: "Mettre à jour une équipe (ex: mettre à jour nbTour)" })
  @ApiParam({ name: "id", description: "ID de l'équipe" })
  @ApiBody({ schema: { example: { nbTour: 230 } } })
  @Put("team/:id")
  async updateTeam(@Param("id") id: string, @Body() data: Prisma.TeamUpdateInput): Promise<Team> {
    return this.teamService.updateTeam({ where: { id: Number(id) }, data });
  }

  @ApiTags("Teams")
  @ApiOperation({ summary: "Supprimer une équipe" })
  @ApiParam({ name: "id", description: "ID de l'équipe" })
  @Delete("team/:id")
  async deleteTeam(@Param("id") id: string): Promise<Team> {
    return this.teamService.deleteTeam({ id: Number(id) });
  }

  // ══════════════════════════════════════════════════════════════════════
  // RUNNERS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Runners")
  @ApiOperation({ summary: "Lister tous les coureurs (public)" })
  @ApiResponse({ status: 200, description: "Liste des coureurs." })
  @Get("runners")
  @Public()
  async getAllRunners(): Promise<Runner[]> {
    return this.runnerService.runners({});
  }

  @ApiTags("Runners")
  @ApiOperation({ summary: "Créer un nouveau coureur" })
  @ApiBody({ schema: { example: { firstName: "Marie", lastName: "Curie", email: "m.curie@insa.fr", team: { connect: { id: 1 } } } } })
  @Post("runner")
  async createRunner(@Body() data: Prisma.RunnerCreateInput): Promise<Runner> {
    return this.runnerService.createRunner(data);
  }

  @ApiTags("Runners")
  @ApiOperation({ summary: "Supprimer un coureur" })
  @ApiParam({ name: "id", description: "ID du coureur" })
  @Delete("runner/:id")
  async deleteRunner(@Param("id") id: string): Promise<Runner> {
    return this.runnerService.deleteRunner({ id: Number(id) });
  }

  // ══════════════════════════════════════════════════════════════════════
  // TRANSPONDERS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Transponders")
  @ApiOperation({ summary: "Lister tous les transpondeurs" })
  @ApiResponse({ status: 200, description: "Liste des 40 puces avec leur statut." })
  @ApiResponse({ status: 401, description: "Token JWT requis." })
  @Get("transponders")
  async getAllTransponders(): Promise<Transponder[]> {
    return this.transponderService.transponders({});
  }

  @ApiTags("Transponders")
  @ApiOperation({ summary: "Statistiques des puces par statut (NEW/IN/OUT/LOST)" })
  @ApiResponse({ status: 200, description: "Exemple: { NEW: 8, IN: 10, OUT: 15, LOST: 7 }" })
  @Get("transponders/stats")
  async getTransponderStats(): Promise<Record<string, number>> {
    const transponders = await this.transponderService.transponders({});
    const stats: Record<string, number> = { NEW: 0, IN: 0, OUT: 0, LOST: 0 };
    for (const t of transponders) {
      stats[t.status] = (stats[t.status] ?? 0) + 1;
    }
    return stats;
  }

  @ApiTags("Transponders")
  @ApiOperation({ summary: "Créer un nouveau transpondeur" })
  @ApiBody({ schema: { example: { status: "NEW" } } })
  @Post("transponder")
  async createTransponder(@Body() data: Prisma.TransponderCreateInput): Promise<Transponder> {
    return this.transponderService.createTransponder(data);
  }

  @ApiTags("Transponders")
  @ApiOperation({ summary: "Mettre à jour le statut d'un transpondeur (ex: marquer LOST)" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { status: "LOST" } } })
  @Put("transponder/:id")
  async updateTransponder(@Param("id") id: string, @Body() data: Prisma.TransponderUpdateInput): Promise<Transponder> {
    return this.transponderService.updateTransponder({ where: { id: Number(id) }, data });
  }

  // ══════════════════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ══════════════════════════════════════════════════════════════════════

  @ApiTags("Transactions")
  @ApiOperation({
    summary: "Créer une transaction de puce (distribution ou retour)",
    description:
      "⚠️ **Règles métier** :\n" +
      "- L'utilisateur doit avoir le rôle `BENEVOLE` ou `ADMIN`\n" +
      "- La puce ne doit pas être déjà `OUT` (déjà attribuée)\n" +
      "- La puce ne doit pas être `LOST`",
  })
  @ApiBody({
    schema: {
      example: {
        transponder: { connect: { id: 1 } },
        runner: { connect: { id: 1 } },
        user: { connect: { id: 2 } },
        type: "OUT",
      },
    },
  })
  @ApiResponse({ status: 201, description: "Transaction créée, statut de la puce mis à jour." })
  @ApiResponse({ status: 400, description: "Puce déjà OUT ou LOST." })
  @ApiResponse({ status: 403, description: "Rôle insuffisant (BENEVOLE ou ADMIN requis)." })
  @Post("transaction")
  async createTransaction(
    @Body() data: Prisma.TransponderTransactionCreateInput,
    @Request() req: { user: { userId: number } },
  ): Promise<TransponderTransaction> {
    return this.transactionService.createTransaction(data, req.user.userId);
  }

  @ApiTags("Transactions")
  @ApiOperation({ summary: "Lister toutes les transactions (historique de distribution)" })
  @ApiResponse({ status: 200, description: "Historique complet des transactions." })
  @Get("transactions")
  async getTransactions(): Promise<TransponderTransaction[]> {
    return this.transactionService.transactions({});
  }
}