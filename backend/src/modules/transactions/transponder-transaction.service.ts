import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { TransponderTransaction, Prisma, TransponderStatus, Role } from "@prisma/client";

@Injectable()
export class TransponderTransactionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère une transaction de transpondeur par son identifiant unique.
   */
  async transaction(
    transactionWhereUniqueInput: Prisma.TransponderTransactionWhereUniqueInput,
  ): Promise<TransponderTransaction | null> {
    return this.prisma.transponderTransaction.findUnique({
      where: transactionWhereUniqueInput,
    });
  }

  /**
   * Récupère une liste de transactions avec filtrage, pagination et tri optionnels.
   */
  async transactions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TransponderTransactionWhereUniqueInput;
    where?: Prisma.TransponderTransactionWhereInput;
    orderBy?: Prisma.TransponderTransactionOrderByWithRelationInput;
  }): Promise<TransponderTransaction[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.transponderTransaction.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  /**
   * Crée une nouvelle transaction de transpondeur avec validation métier :
   * 1. Vérifie que l'utilisateur qui effectue la transaction a le rôle BENEVOLE ou ADMIN.
   * 2. Vérifie que le transpondeur n'est pas déjà dans l'état "OUT" (déjà remis) ou "LOST".
   * Si ces conditions ne sont pas remplies, une erreur HTTP est levée.
   *
   * @param data Les données nécessaires à la création de la transaction (Prisma input type).
   * @param requestingUserId L'ID de l'utilisateur qui crée la transaction (extrait du JWT).
   */
  async createTransaction(
    data: Prisma.TransponderTransactionCreateInput,
    requestingUserId: number,
  ): Promise<TransponderTransaction> {
    // --- Vérification du rôle de l'utilisateur ---
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new ForbiddenException("Utilisateur introuvable.");
    }

    if (requestingUser.role !== Role.BENEVOLE && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        "Seuls les bénévoles et les administrateurs peuvent enregistrer une transaction de transpondeur.",
      );
    }

    // --- Vérification du statut actuel du transpondeur ---
    // On extrait l'ID du transpondeur depuis les données d'input Prisma (connect syntax)
    const transponderId = (data.transponder.connect as { id: number })?.id;

    if (!transponderId) {
      throw new BadRequestException("L'identifiant du transpondeur est requis.");
    }

    const transponder = await this.prisma.transponder.findUnique({
      where: { id: transponderId },
    });

    if (!transponder) {
      throw new BadRequestException(`Transpondeur #${transponderId} introuvable.`);
    }

    // Un transpondeur "ATTRIBUE" (prêté) ne peut pas être ré-assigné sans une restitution préalable.
    if (transponder.status === TransponderStatus.ATTRIBUE) {
      throw new BadRequestException(
        `Le transpondeur #${transponderId} est déjà en cours d'utilisation (statut ATTRIBUE). Il doit être rendu avant de pouvoir être réassigné.`,
      );
    }

    if (transponder.status === TransponderStatus.PERDU) {
      throw new BadRequestException(
        `Le transpondeur #${transponderId} est marqué comme PERDU et ne peut pas être attribué.`,
      );
    }

    // --- Création de la transaction et mise à jour du statut du transpondeur ---
    const [newTransaction] = await this.prisma.$transaction([
      // Créer la transaction
      this.prisma.transponderTransaction.create({ data }),
      // Mettre à jour le statut du transpondeur selon le type de transaction
      this.prisma.transponder.update({
        where: { id: transponderId },
        data: { status: data.type as TransponderStatus },
      }),
    ]);

    return newTransaction;
  }

  /**
   * Met à jour une transaction existante.
   */
  async updateTransaction(params: {
    where: Prisma.TransponderTransactionWhereUniqueInput;
    data: Prisma.TransponderTransactionUpdateInput;
  }): Promise<TransponderTransaction> {
    const { where, data } = params;
    return this.prisma.transponderTransaction.update({ data, where });
  }

  /**
   * Supprime une transaction.
   */
  async deleteTransaction(
    where: Prisma.TransponderTransactionWhereUniqueInput,
  ): Promise<TransponderTransaction> {
    return this.prisma.transponderTransaction.delete({ where });
  }
}
