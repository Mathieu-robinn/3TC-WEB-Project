import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, TransponderTransaction } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateTransactionDto } from "./dto/transaction.dto.js";
import { TransponderTransactionService } from "./transponder-transaction.service.js";

@ApiTags("Transactions")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TransactionsController {
  constructor(private readonly transactionService: TransponderTransactionService) {}

  @ApiOperation({
    summary: "Créer une transaction de puce (distribution ou retour)",
    description:
      "L'utilisateur doit avoir le rôle BENEVOLE ou ADMIN. La puce ne doit pas être OUT ou LOST.",
  })
  @ApiBody({
    schema: {
      example: { transponderId: 1, runnerId: 1, type: "OUT" },
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
      ...(data.runnerId ? { runner: { connect: { id: data.runnerId } } } : {}),
      type: data.type,
    };
    return this.transactionService.createTransaction(prismaData, req.user.userId);
  }

  @ApiOperation({ summary: "Lister toutes les transactions" })
  @ApiResponse({ status: 200, description: "Historique complet des transactions." })
  @Get("transactions")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async getTransactions(): Promise<TransponderTransaction[]> {
    return this.transactionService.transactions({});
  }
}

