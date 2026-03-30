import { Body, Controller, Get, Post, Request, UseGuards, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, TransponderTransaction } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateTransactionDto } from "./dto/transaction.dto.js";
import { TransponderTransactionService } from "./transponder-transaction.service.js";
import { EditionService } from "../editions/edition.service.js";

@ApiTags("Transactions")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TransactionsController {
  constructor(
    private readonly transactionService: TransponderTransactionService,
    private readonly editionService: EditionService,
  ) { }

  @ApiOperation({ summary: "Créer une transaction pour un transpondeur (ex: distribution, retour)" })
  @ApiResponse({ status: 201, description: "Transaction enregistrée." })
  @ApiResponse({
    status: 403,
    description:
      "L'utilisateur doit avoir le rôle BENEVOLE ou ADMIN. La puce ne doit pas être ATTRIBUE ou PERDU.",
  })
  @ApiBody({
    schema: {
      example: { transponderId: 1, teamId: 1, type: "ATTRIBUE" },
    },
  })
  @ApiResponse({ status: 201, description: "Transaction créée, statut de la puce mis à jour." })
  @Post("transaction")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async createTransaction(
    @Body() data: CreateTransactionDto,
    @Request() req: { user: { userId: number } },
  ): Promise<TransponderTransaction> {
    const prismaData: Prisma.TransponderTransactionCreateInput = {
      transponder: { connect: { id: data.transponderId } },
      user: { connect: { id: req.user.userId } },
      ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
      type: data.type,
    };
    return this.transactionService.createTransaction(prismaData, req.user.userId);
  }

  @ApiOperation({ summary: "Lister toutes les transactions" })
  @ApiResponse({ status: 200, description: "Historique complet des transactions." })
  @Get("transactions")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async getTransactions(@Request() req: { user: { role: Role } }): Promise<TransponderTransaction[]> {
    const editionId = await this.editionService.getActiveEditionId();
    const includeActor = req.user.role === Role.ADMIN;
    return this.transactionService.transactionsForActiveEdition(editionId, includeActor);
  }

  @ApiOperation({ summary: "Lister toutes les transactions d'une team" })
  @ApiParam({ name: "id", description: "ID de la team" })
  @ApiResponse({ status: 200, description: "Historique complet des transactions d'une team." })
  @Get("transactions/team/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async getTeamTransactions(
    @Param("id") id: string,
    @Request() req: { user: { role: Role } },
  ) {
    const editionId = await this.editionService.getActiveEditionId();
    const includeActor = req.user.role === Role.ADMIN;
    return this.transactionService.getTeamTransactionsForActiveEdition(Number(id), editionId, includeActor);
  }

  @ApiOperation({ summary: "Lister toutes les transactions d'un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Historique complet des transactions d'un utilisateur." })

  @ApiOperation({ summary: "Lister les transactions liées à un transpondeur" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiResponse({ status: 200, description: "Historique de la puce (récent en premier)." })
  @Get("transactions/transponder/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async getTransponderTransactions(
    @Param("id") id: string,
    @Request() req: { user: { role: Role } },
  ) {
    const editionId = await this.editionService.getActiveEditionId();
    const includeActor = req.user.role === Role.ADMIN;
    return this.transactionService.getTransponderTransactionsForActiveEdition(Number(id), editionId, includeActor);
  }

  @Get("transactions/user/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async getUserTransactions(@Param("id") id: string): Promise<TransponderTransaction[]> {
    return this.transactionService.getUserTransactions(Number(id));
  }
}

