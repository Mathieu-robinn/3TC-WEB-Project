import { Body, Controller, Get, Param, Post, Put, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, Transponder } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { AssignTransponderDto, CreateTransponderDto, UpdateTransponderDto } from "./dto/transponder.dto.js";
import { TransponderService } from "./transponder.service.js";

@ApiTags("Transponders")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TranspondersController {
  constructor(private readonly transponderService: TransponderService) { }

  @ApiOperation({ summary: "Lister tous les transpondeurs" })
  @ApiResponse({ status: 200, description: "Liste des puces." })
  @ApiResponse({ status: 401, description: "Token JWT requis." })
  @Get("transponders")
  async getAllTransponders() {
    return this.transponderService.transponders({});
  }

  @ApiOperation({ summary: "Statistiques des puces par statut" })
  @ApiResponse({ status: 200, description: "Exemple: { EN_ATTENTE: 8, ATTRIBUE: 15, PERDU: 7, RECUPERE: 10 }" })
  @Get("transponders/stats")
  async getTransponderStats(): Promise<Record<string, number>> {
    const transponders = await this.transponderService.transponders({});
    const stats: Record<string, number> = { EN_ATTENTE: 0, ATTRIBUE: 0, PERDU: 0, RECUPERE: 0 };
    for (const t of transponders) {
      stats[t.status] = (stats[t.status] ?? 0) + 1;
    }
    return stats;
  }

  @ApiOperation({ summary: "Equipes sans transpondeur actif (sans transpondeur ou transpondeur perdu)" })
  @ApiResponse({ status: 200, description: "Liste des équipes éligibles pour recevoir un transpondeur." })
  @Get("transponders/unassigned-teams")
  async getTeamsWithoutTransponder() {
    return this.transponderService.teamsWithoutActiveTransponder();
  }

  @ApiOperation({ summary: "Assigner un transpondeur à une équipe" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { teamId: 1 } } })
  @Put("transponder/:id/assign")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async assignTransponder(@Param("id") id: string, @Body() data: AssignTransponderDto) {
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (current?.status === ("RECUPERE" as any)) {
      throw new BadRequestException("On ne peut plus modifier l'état d'un transpondeur récupéré.");
    }

    if (data.teamId) {
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

    // Utiliser les champs directs teamId pour éviter les erreurs
    // Prisma avec disconnect sur des relations déjà nulles
    return this.transponderService.updateTransponderFields(
      Number(id),
      { status: "ATTRIBUE" as any, teamId: data.teamId ?? null },
    );
  }

  @ApiOperation({ summary: "Récupérer un transpondeur (fin de sa vie)" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @Put("transponder/:id/unassign")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async unassignTransponder(@Param("id") id: string) {
    // NEW = RECUPERE
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (current?.status === ("RECUPERE" as any)) {
      throw new BadRequestException("Le transpondeur est déjà récupéré.");
    }

    return this.transponderService.updateTransponderFields(
      Number(id),
      { status: "RECUPERE" as any, teamId: current?.teamId },
    );
  }

  @ApiOperation({ summary: "Créer un nouveau transpondeur" })
  @ApiBody({ schema: { example: { status: "EN_ATTENTE" } } })
  @Post("transponder")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async createTransponder(@Body() data: CreateTransponderDto): Promise<Transponder> {
    const prismaData: Prisma.TransponderCreateInput = {
      status: data.status ?? ("EN_ATTENTE" as any),
    };
    return this.transponderService.createTransponder(prismaData);
  }

  @ApiOperation({ summary: "Mettre à jour le statut d'un transpondeur" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { status: "PERDU" } } })
  @Put("transponder/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async updateTransponder(@Param("id") id: string, @Body() data: UpdateTransponderDto) {
    const current = await this.transponderService.transponder({ id: Number(id) });
    if (current?.status === ("RECUPERE" as any)) {
      throw new BadRequestException("On ne peut plus modifier l'état d'un transpondeur récupéré.");
    }
    const prismaData: Prisma.TransponderUpdateInput = { status: data.status };
    // const transationData: Prisma.TransponderTransactionCreateInput = {
    //   // Prisma attend un objet Date, pas une string (souvent le cas avec StringDate.now())
    //   dateTime: new Date(),

    //   // Le type doit correspondre à l'Enum TransponderStatus
    //   type: current?.status,

    //   // Pour les relations, on utilise 'connect'
    //   transponder: {
    //     connect: { id: current!.id }
    //   },

    //   // L'utilisateur qui fait l'action
    //   user: {
    //     connect: { id: current!.user.id }
    //   },

    //   // La team est optionnelle dans ton schéma (Team?)
    //   // On utilise le spread operator pour ne l'ajouter que si elle existe
    //   ...(current!.teamId && {
    //     team: {
    //       connect: { id: current.teamId }
    //     }
    //   })
    // };
    return this.transponderService.updateTransponder({ where: { id: Number(id) }, data: prismaData });
  }
}

