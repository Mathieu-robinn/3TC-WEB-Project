import { Body, Controller, Param, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { LogType, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { LogService } from "../log/log.service.js";
import { ImportParticipantsBodyDto } from "./dto/import-participants.dto.js";
import { ImportService } from "./import.service.js";

@ApiTags("Import")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly logService: LogService,
  ) {}

  @ApiOperation({
    summary: "Importer des participants depuis un CSV parsé (admin)",
    description:
      "Crée courses/équipes/participants manquants dans l'édition cible. dryRun=true pour simuler sans écrire.",
  })
  @ApiParam({ name: "editionId", description: "ID de l'édition cible" })
  @ApiBody({
    schema: {
      example: {
        dryRun: true,
        rows: [
          {
            lineNumber: 2,
            courseName: "Marathon",
            teamName: "Les Fous",
            lastName: "Dupont",
            firstName: "Jean",
            email: "jean@mail.fr",
            isCaptain: true,
          },
        ],
      },
    },
  })
  @Post("edition/:editionId/import-participants")
  @Roles(Role.ADMIN)
  async importParticipants(
    @Param("editionId") editionId: string,
    @Body() body: ImportParticipantsBodyDto,
    @Request() req: { user: { userId: number } },
  ) {
    const result = await this.importService.importParticipants(
      Number(editionId),
      body.rows,
      body.dryRun ?? false,
    );

    if (!body.dryRun) {
      try {
        await this.logService.createLog({
          type: LogType.ADD_USER,
          message: `Import CSV édition #${editionId} : ${result.created.runners} participant(s), ${result.created.teams} équipe(s), ${result.created.courses} course(s) ; ${result.skipped} ignoré(s) ; ${result.errors.length} erreur(s).`,
          user: { connect: { id: req.user.userId } },
          details: {
            editionId: Number(editionId),
            created: result.created,
            skipped: result.skipped,
            errorCount: result.errors.length,
          },
        });
      } catch (e) {
        console.error("[ImportController] log:", e);
      }
    }

    return result;
  }
}
