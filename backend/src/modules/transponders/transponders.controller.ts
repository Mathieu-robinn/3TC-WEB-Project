import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LogType, Prisma, Role, Transponder } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import {
  AssignTransponderDto,
  CreateTransponderDto,
  CreateTranspondersBatchDto,
  DeleteTranspondersBatchDto,
  UpdateTransponderDto,
} from "./dto/transponder.dto.js";
import { TransponderService } from "./transponder.service.js";
import { EditionService } from "../editions/edition.service.js";
import { LogService } from "../log/log.service.js";

@ApiTags("Transponders")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TranspondersController {
  constructor(
    private readonly transponderService: TransponderService,
    private readonly editionService: EditionService,
    private readonly logService: LogService,
  ) { }

  private async transponderWhereForActiveEdition(): Promise<Prisma.TransponderWhereInput | null> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      return null;
    }
    return { editionId };
  }

  @ApiOperation({ summary: "Lister tous les transpondeurs" })
  @ApiResponse({ status: 200, description: "Liste des puces." })
  @ApiResponse({ status: 401, description: "Token JWT requis." })
  @Get("transponders")
  async getAllTransponders() {
    const where = await this.transponderWhereForActiveEdition();
    if (where == null) {
      return [];
    }
    return this.transponderService.transponders({
      where,
      orderBy: { numero: "asc" },
    });
  }

  @ApiOperation({ summary: "Statistiques des puces par statut" })
  @ApiResponse({
    status: 200,
    description: "Exemple: { EN_ATTENTE, ATTRIBUE, PERDU, RECUPERE, DEFAILLANT }",
  })
  @Get("transponders/stats")
  async getTransponderStats(): Promise<Record<string, number>> {
    const where = await this.transponderWhereForActiveEdition();
    const transponders = where == null ? [] : await this.transponderService.transponders({ where });
    const stats: Record<string, number> = { EN_ATTENTE: 0, ATTRIBUE: 0, PERDU: 0, RECUPERE: 0, DEFAILLANT: 0 };
    for (const t of transponders) {
      stats[t.status] = (stats[t.status] ?? 0) + 1;
    }
    return stats;
  }

  @ApiOperation({ summary: "Equipes sans transpondeur actif (sans transpondeur ou transpondeur perdu)" })
  @ApiResponse({ status: 200, description: "Liste des équipes éligibles pour recevoir un transpondeur." })
  @Get("transponders/unassigned-teams")
  async getTeamsWithoutTransponder() {
    const editionId = await this.editionService.getActiveEditionId();
    return this.transponderService.teamsWithoutActiveTransponder(editionId);
  }

  @ApiOperation({ summary: "Assigner un transpondeur à une équipe" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { teamId: 1 } } })
  @Put("transponder/:id/assign")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async assignTransponder(
    @Param("id") id: string,
    @Body() data: AssignTransponderDto,
    @Request() req: { user: { userId: number } },
  ) {
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (!current) {
      throw new BadRequestException(`Transpondeur #${id} introuvable.`);
    }
    if (current.status === ("RECUPERE" as any)) {
      throw new BadRequestException("On ne peut plus modifier l'état d'un transpondeur récupéré.");
    }
    if (current.status === ("DEFAILLANT" as any)) {
      throw new BadRequestException(
        "Transpondeur défaillant : remettez-le d'abord en « en attente » depuis la fiche transpondeur.",
      );
    }

    if (data.teamId) {
      if (data.holderRunnerId == null) {
        throw new BadRequestException("Indiquez à quel coureur le transpondeur est remis.");
      }
      await this.transponderService.assertTeamEligibleForTransponderAssignment(data.teamId);
      await this.transponderService.assertTeamMatchesTransponderEdition(current.editionId, data.teamId);
      await this.transponderService.assertHolderRunnerBelongsToTeam(data.teamId, data.holderRunnerId);
      const activeCount = await this.transponderService.transponders({
        where: { teamId: data.teamId, status: "ATTRIBUE" as any },
      });
      // Vérifier si la puce n'est pas DEJA attribuée à cette même équipe.
      // Si la longueur est > 0 ET que ce n'est pas le transpondeur actuel, on bloque.
      const hasOther = activeCount.filter(t => t.id !== Number(id));
      if (hasOther.length > 0) {
        throw new BadRequestException("Une équipe ne peut avoir qu'un seul transpondeur actif.");
      }
    }

    return this.transponderService.updateTransponderFieldsWithAudit(
      Number(id),
      { status: "ATTRIBUE" as any, teamId: data.teamId ?? null },
      req.user.userId,
      data.teamId != null && data.holderRunnerId != null
        ? {
            setTransponderHolderOnTeam: { teamId: data.teamId, runnerId: data.holderRunnerId },
          }
        : undefined,
    );
  }

  @ApiOperation({ summary: "Récupérer un transpondeur (fin de sa vie)" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @Put("transponder/:id/unassign")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async unassignTransponder(
    @Param("id") id: string,
    @Request() req: { user: { userId: number } },
  ) {
    // NEW = RECUPERE (fin de course pour un transpondeur encore attribué — pas pour PERDU)
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (current?.status === ("RECUPERE" as any)) {
      throw new BadRequestException("Le transpondeur est déjà récupéré.");
    }
    if (current?.status === ("PERDU" as any)) {
      throw new BadRequestException(
        "Un transpondeur perdu ne peut pas être « récupéré » comme fin de course. Remettez-le en stock s'il est retrouvé.",
      );
    }
    if (current?.status !== ("ATTRIBUE" as any)) {
      throw new BadRequestException(
        "Seul un transpondeur encore attribué à une équipe peut être récupéré (fin de course).",
      );
    }

    return this.transponderService.updateTransponderFieldsWithAudit(
      Number(id),
      { status: "RECUPERE" as any, teamId: null },
      req.user.userId,
      {
        teamIdForTransaction: current?.teamId ?? null,
        markTeamCourseFinishedForTeamId: current?.teamId ?? undefined,
        setTransponderHolderOnTeam:
          current?.teamId != null
            ? { teamId: current.teamId, runnerId: null }
            : undefined,
      },
    );
  }

  @ApiOperation({ summary: "Créer un nouveau transpondeur (numéro unique par édition)" })
  @ApiBody({ schema: { example: { numero: 42, status: "EN_ATTENTE" } } })
  @Post("transponder")
  @Roles(Role.ADMIN)
  async createTransponder(
    @Body() data: CreateTransponderDto,
    @Request() req: { user: { userId: number } },
  ): Promise<Transponder> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      throw new BadRequestException(
        "Aucune édition disponible : impossible de créer un transpondeur.",
      );
    }
    const prismaData: Prisma.TransponderCreateInput = {
      numero: data.numero,
      status: data.status ?? ("EN_ATTENTE" as any),
      edition: { connect: { id: editionId } },
    };
    const t = await this.transponderService.createTransponder(prismaData);
    try {
      await this.logService.createLog({
        type: LogType.ADD_TRANSPONDER,
        message: `Création du transpondeur n°${t.numero} (id ${t.id}).`,
        user: { connect: { id: req.user.userId } },
        details: { transponderId: t.id, transponderNumero: t.numero },
      });
    } catch (e) {
      console.error("[TranspondersController] ADD_TRANSPONDER log:", e);
    }
    return t;
  }

  @ApiOperation({ summary: "Créer plusieurs transpondeurs en attente (numéros uniques pour l’édition active)" })
  @ApiBody({ schema: { example: { numeros: [1, 2, 3, 10, 11] } } })
  @Post("transponders/batch")
  @Roles(Role.ADMIN)
  async createTranspondersBatch(
    @Body() data: CreateTranspondersBatchDto,
    @Request() req: { user: { userId: number } },
  ): Promise<Transponder[]> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      throw new BadRequestException(
        "Aucune édition disponible : impossible de créer des transpondeurs.",
      );
    }
    const created = await this.transponderService.createTranspondersBatch(editionId, data.numeros);
    try {
      await this.logService.createLog({
        type: LogType.ADD_TRANSPONDER,
        message: `Création de ${created.length} transpondeur(s) en attente : ${created.map((c) => c.numero).join(", ")}.`,
        user: { connect: { id: req.user.userId } },
        details: {
          transponderIds: created.map((c) => c.id),
          numeros: created.map((c) => c.numero),
        },
      });
    } catch (e) {
      console.error("[TranspondersController] ADD_TRANSPONDER batch log:", e);
    }
    return created;
  }

  @ApiOperation({ summary: "Supprimer plusieurs transpondeurs (édition active, pas de puce ATTRIBUE)" })
  @ApiBody({ schema: { example: { ids: [1, 2, 3] } } })
  @Post("transponders/delete-batch")
  @Roles(Role.ADMIN)
  async deleteTranspondersBatch(
    @Body() data: DeleteTranspondersBatchDto,
    @Request() req: { user: { userId: number } },
  ): Promise<{ deleted: number }> {
    const editionId = await this.editionService.getActiveEditionId();
    if (editionId == null) {
      throw new BadRequestException("Aucune édition active.");
    }
    const result = await this.transponderService.deleteTranspondersBatch(editionId, data.ids);
    try {
      await this.logService.createLog({
        type: LogType.DELETE_TRANSPONDER,
        message: `Suppression de ${result.deleted} transpondeur(s) (ids : ${data.ids.join(", ")}).`,
        user: { connect: { id: req.user.userId } },
        details: { ids: data.ids, deleted: result.deleted },
      });
    } catch (e) {
      console.error("[TranspondersController] DELETE_TRANSPONDER log:", e);
    }
    return result;
  }

  @ApiOperation({ summary: "Mettre à jour le statut d'un transpondeur" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { status: "PERDU" } } })
  @Put("transponder/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async updateTransponder(
    @Param("id") id: string,
    @Body() data: UpdateTransponderDto,
    @Request() req: { user: { userId: number; role?: Role } },
  ) {
    if (
      data.status === ("EN_ATTENTE" as any) &&
      req.user?.role !== Role.ADMIN &&
      req.user?.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException("Seuls les administrateurs peuvent remettre une puce en stock.");
    }
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (current?.status === ("RECUPERE" as any)) {
      throw new BadRequestException("On ne peut plus modifier l'état d'un transpondeur récupéré.");
    }
    const clearsTeam =
      data.status === ("PERDU" as any) || data.status === ("DEFAILLANT" as any);
    const prismaData: Prisma.TransponderUpdateInput = {
      status: data.status,
      ...(clearsTeam ? { teamId: null } : {}),
    };
    const updated = await this.transponderService.updateTransponderWithAudit({
      where: { id: Number(id) },
      data: prismaData,
      actorUserId: req.user.userId,
      teamIdForTransaction: current?.teamId ?? null,
      setTransponderHolderOnTeam:
        clearsTeam && current?.teamId != null
          ? { teamId: current.teamId, runnerId: null }
          : undefined,
    });
    if (
      data.status === ("DEFAILLANT" as any) &&
      current?.status !== ("DEFAILLANT" as any)
    ) {
      await this.logService.createLog({
        type: LogType.DEFECT_TRANSPONDER,
        message: `Transpondeur n°${updated.numero} (id ${updated.id}) signalé défaillant.`,
        user: { connect: { id: req.user.userId } },
        details: { transponderId: updated.id, transponderNumero: updated.numero },
      });
    }
    return updated;
  }
}

