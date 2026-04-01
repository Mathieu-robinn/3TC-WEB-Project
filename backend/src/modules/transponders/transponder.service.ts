import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service.js";
import { Prisma, Transponder, TransponderStatus } from "@prisma/client";
import { LogService } from "../log/log.service.js";
import { logTypeForTransponderAudit, transponderAuditMessage } from "../log/transponder-audit-log.util.js";
import { NotificationDispatchService } from "../notification/notification-dispatch.service.js";

type TransponderWithTeam = Transponder & { team: { name: string } | null };

@Injectable()
export class TransponderService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationDispatch: NotificationDispatchService,
    private readonly logService: LogService,
  ) {}

  private async writeTransponderAuditLog(actorUserId: number, updated: TransponderWithTeam): Promise<void> {
    const lt = logTypeForTransponderAudit(updated.status);
    if (!lt) {
      return;
    }
    try {
      await this.logService.createLog({
        type: lt,
        message: transponderAuditMessage(
          updated.status,
          updated.numero,
          updated.id,
          updated.team?.name ?? null,
        ),
        user: { connect: { id: actorUserId } },
        details: {
          transponderId: updated.id,
          transponderNumero: updated.numero,
          teamName: updated.team?.name ?? undefined,
          status: updated.status,
        },
      });
    } catch (e) {
      console.error("[TransponderService] audit log:", e);
    }
  }

  async transponder(transponderWhereUniqueInput: Prisma.TransponderWhereUniqueInput): Promise<Transponder | null> {
    return this.prisma.transponder.findUnique({
      where: transponderWhereUniqueInput,
      include: { team: true, edition: true },
    });
  }

  async transponders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TransponderWhereUniqueInput;
    where?: Prisma.TransponderWhereInput;
    orderBy?: Prisma.TransponderOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.transponder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { team: true, edition: true },
    });
  }

  /**
   * Retourne les équipes qui n'ont pas de transpondeur actif (pas de transpondeur avec status OUT)
   * ou qui ont perdu leur transpondeur (tous leurs transpondeurs sont LOST).
   */
  async teamsWithoutActiveTransponder(editionId: number | null) {
    if (editionId == null) {
      return [];
    }
    const teams = await this.prisma.team.findMany({
      where: {
        courseFinished: false,
        course: { editionId },
      },
      include: {
        transponders: true,
        runners: true,
      },
    });

    return teams.filter((team) => {
      if (team.runners.length === 0) return false;
      const teamActiveTransponders = team.transponders.filter(
        (t) =>
          t.editionId === editionId && (t.status === "ATTRIBUE" || t.status === "RECUPERE"),
      );
      if (teamActiveTransponders.length > 0) return false;
      return true;
    });
  }

  /** Vérifie qu'une équipe peut recevoir un transpondeur (course non terminée, au moins un coureur). */
  async assertTeamEligibleForTransponderAssignment(teamId: number): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { runners: true } } },
    });
    if (!team) {
      throw new BadRequestException(`Équipe #${teamId} introuvable.`);
    }
    if (team._count.runners < 1) {
      throw new BadRequestException(
        "Cette équipe n'a aucun participant : impossible d'attribuer un transpondeur.",
      );
    }
    if (team.courseFinished) {
      throw new BadRequestException(
        "Cette équipe a terminé la course : aucun transpondeur ne peut lui être attribué.",
      );
    }
  }

  /** Le coureur désigné comme détenteur doit appartenir à l'équipe. */
  async assertHolderRunnerBelongsToTeam(teamId: number, runnerId: number): Promise<void> {
    const r = await this.prisma.runner.findUnique({ where: { id: runnerId } });
    if (!r || r.teamId !== teamId) {
      throw new BadRequestException("Le coureur choisi doit appartenir à l'équipe.");
    }
  }

  /** L'équipe doit appartenir au même parcours / édition que le transpondeur. */
  async assertTeamMatchesTransponderEdition(transponderEditionId: number, teamId: number): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { course: true },
    });
    if (!team) {
      throw new BadRequestException(`Équipe #${teamId} introuvable.`);
    }
    if (team.course.editionId !== transponderEditionId) {
      throw new BadRequestException(
        "Cette équipe n'appartient pas à la même édition que ce transpondeur.",
      );
    }
  }

  async createTransponder(data: Prisma.TransponderCreateInput): Promise<Transponder> {
    return this.prisma.transponder.create({
      data,
      include: { team: true, edition: true },
    });
  }

  /** Crée plusieurs transpondeurs « en attente » pour l’édition active. Vérifie l’unicité (editionId, numero). */
  async createTranspondersBatch(editionId: number, numeros: number[]): Promise<Transponder[]> {
    const unique = new Set(numeros);
    if (unique.size !== numeros.length) {
      throw new BadRequestException("La liste contient des numéros en double.");
    }
    const existing = await this.prisma.transponder.findMany({
      where: { editionId, numero: { in: numeros } },
      select: { numero: true },
    });
    if (existing.length > 0) {
      const taken = existing.map((e) => e.numero).join(", ");
      throw new BadRequestException(
        `Numéro(s) déjà utilisé(s) pour cette édition : ${taken}.`,
      );
    }
    return this.prisma.$transaction(
      numeros.map((numero) =>
        this.prisma.transponder.create({
          data: {
            numero,
            status: TransponderStatus.EN_ATTENTE,
            edition: { connect: { id: editionId } },
          },
          include: { team: true, edition: true },
        }),
      ),
    );
  }

  async updateTransponder(params: {
    where: Prisma.TransponderWhereUniqueInput;
    data: Prisma.TransponderUpdateInput;
  }) {
    const { where, data } = params;
    return this.prisma.transponder.update({
      data,
      where,
      include: { team: true, edition: true },
    });
  }

  /**
   * Met à jour un transpondeur via ses champs scalaires directement
   * (teamId, runnerId, status) sans passer par les opérations de relation Prisma
   * (connect/disconnect), ce qui évite les erreurs sur des relations déjà nulles.
   */
  async updateTransponderFields(
    id: number,
    fields: { status?: string; teamId?: number | null },
  ) {
    return this.prisma.transponder.update({
      where: { id },
      data: {
        ...(fields.status !== undefined ? { status: fields.status as any } : {}),
        ...(fields.teamId !== undefined ? { teamId: fields.teamId } : {}),
      },
      include: { team: true, edition: true },
    });
  }

  /**
   * Met à jour le statut et/ou l'équipe d'une puce et enregistre une ligne d'historique
   * (`TransponderTransaction`) dans la même transaction SQL que la mise à jour.
   * Utilisé par assign / unassign depuis l'API transpondeurs.
   *
   * @param actorUserId Identifiant du bénévole ou admin connecté (JWT), auteur de l'opération.
   */
  async updateTransponderFieldsWithAudit(
    id: number,
    fields: { status?: string; teamId?: number | null },
    actorUserId: number,
    auditOptions?: {
      teamIdForTransaction?: number | null;
      /** Si défini, met l'équipe en course terminée (récupération de transpondeur). */
      markTeamCourseFinishedForTeamId?: number | null;
      /** Met à jour le coureur « Resp transpondeur » sur l'équipe (assign ou `null` si retrait). */
      setTransponderHolderOnTeam?: { teamId: number; runnerId: number | null };
    },
  ): Promise<Transponder> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transponder.update({
        where: { id },
        data: {
          ...(fields.status !== undefined ? { status: fields.status as TransponderStatus } : {}),
          ...(fields.teamId !== undefined ? { teamId: fields.teamId } : {}),
        },
        include: { team: true, edition: true },
      });
      const teamIdLogged =
        auditOptions?.teamIdForTransaction !== undefined
          ? auditOptions.teamIdForTransaction
          : updated.teamId;
      await tx.transponderTransaction.create({
        data: {
          transponderId: id,
          teamId: teamIdLogged,
          userId: actorUserId,
          type: updated.status,
          dateTime: new Date(),
        },
      });
      const holder = auditOptions?.setTransponderHolderOnTeam;
      if (holder != null) {
        await tx.team.update({
          where: { id: holder.teamId },
          data: { transponderHolderRunnerId: holder.runnerId },
        });
      }
      const finishId = auditOptions?.markTeamCourseFinishedForTeamId;
      if (finishId != null) {
        await tx.team.update({
          where: { id: finishId },
          data: { courseFinished: true },
        });
      }
      return updated;
    }).then(async (updated) => {
      await this.notificationDispatch.notifyAutomaticTransponderEvent({
        newStatus: updated.status,
        transponderNumero: updated.numero,
        transponderId: updated.id,
        teamName: updated.team?.name ?? null,
        actorUserId,
      });
      await this.writeTransponderAuditLog(actorUserId, updated as TransponderWithTeam);
      return updated;
    });
  }

  /**
   * Met à jour un transpondeur via un `TransponderUpdateInput` Prisma et journalise
   * le nouveau statut dans `TransponderTransaction` (ex. déclaration de perte).
   */
  async updateTransponderWithAudit(params: {
    where: Prisma.TransponderWhereUniqueInput;
    data: Prisma.TransponderUpdateInput;
    actorUserId: number;
    teamIdForTransaction?: number | null;
    setTransponderHolderOnTeam?: { teamId: number; runnerId: number | null };
  }): Promise<Transponder> {
    const { where, data, actorUserId, teamIdForTransaction, setTransponderHolderOnTeam } = params;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transponder.update({
        where,
        data,
        include: { team: true, edition: true },
      });
      const teamIdLogged =
        teamIdForTransaction !== undefined ? teamIdForTransaction : updated.teamId;
      await tx.transponderTransaction.create({
        data: {
          transponderId: updated.id,
          teamId: teamIdLogged,
          userId: actorUserId,
          type: updated.status,
          dateTime: new Date(),
        },
      });
      if (setTransponderHolderOnTeam != null) {
        await tx.team.update({
          where: { id: setTransponderHolderOnTeam.teamId },
          data: { transponderHolderRunnerId: setTransponderHolderOnTeam.runnerId },
        });
      }
      return updated;
    }).then(async (updated) => {
      await this.notificationDispatch.notifyAutomaticTransponderEvent({
        newStatus: updated.status,
        transponderNumero: updated.numero,
        transponderId: updated.id,
        teamName: updated.team?.name ?? null,
        actorUserId,
      });
      await this.writeTransponderAuditLog(actorUserId, updated as TransponderWithTeam);
      return updated;
    });
  }

  async deleteTransponder(where: Prisma.TransponderWhereUniqueInput): Promise<Transponder> {
    return this.prisma.transponder.delete({
      where,
    });
  }

  /** Suppression en masse (édition active uniquement). Impossible si une puce est encore ATTRIBUE. */
  async deleteTranspondersBatch(editionId: number, ids: number[]): Promise<{ deleted: number }> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      return { deleted: 0 };
    }
    const rows = await this.prisma.transponder.findMany({
      where: { id: { in: unique }, editionId },
      select: { id: true, status: true },
    });
    if (rows.length !== unique.length) {
      throw new BadRequestException(
        "Un ou plusieurs transpondeurs n'appartiennent pas à l'édition active.",
      );
    }
    if (rows.some((t) => t.status === TransponderStatus.ATTRIBUE)) {
      throw new BadRequestException(
        "Impossible de supprimer une puce encore attribuée à une équipe. Détachez-la d'abord.",
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.transponderTransaction.deleteMany({ where: { transponderId: { in: unique } } });
      await tx.transponder.deleteMany({ where: { id: { in: unique }, editionId } });
    });
    return { deleted: unique.length };
  }
}
