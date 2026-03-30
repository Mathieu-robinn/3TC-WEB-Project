import { Injectable } from "@nestjs/common";
import { LogType, NotificationType, Role, TransponderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma.service.js";
import { EventsGateway } from "../../events/events.gateway.js";
import { LogService } from "../log/log.service.js";
import { notificationToJson } from "./notification-json.util.js";

export type NotificationAudience = "ADMINS" | "BENEVOLES" | "ALL";

const senderSelect = { id: true, firstName: true, lastName: true, email: true } as const;

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly logService: LogService,
  ) {}

  private emitCreated(
    userId: number,
    row: Parameters<typeof notificationToJson>[0],
  ) {
    this.eventsGateway.sendNotificationToUser(userId, notificationToJson(row));
  }

  /**
   * Notifications automatiques : une ligne par administrateur.
   */
  async dispatchToAdmins(type: NotificationType, message: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    for (const { id } of admins) {
      const created = await this.prisma.notification.create({
        data: {
          type,
          message,
          user: { connect: { id } },
          state: "UNSEEN",
          processed: false,
        },
        include: { sender: { select: senderSelect } },
      });
      this.emitCreated(id, created);
    }
  }

  /**
   * Envoi manuel : audience ciblée, une ligne par destinataire.
   */
  async dispatchToAudience(
    type: NotificationType,
    message: string,
    audience: NotificationAudience,
    senderUserId: number,
  ): Promise<void> {
    const where =
      audience === "ADMINS"
        ? { role: Role.ADMIN }
        : audience === "BENEVOLES"
          ? { role: Role.BENEVOLE }
          : {};
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });
    for (const { id } of users) {
      const created = await this.prisma.notification.create({
        data: {
          type,
          message,
          user: { connect: { id } },
          state: "UNSEEN",
          processed: false,
          sender: { connect: { id: senderUserId } },
        },
        include: { sender: { select: senderSelect } },
      });
      this.emitCreated(id, created);
    }
    try {
      const audienceLabel =
        audience === "ADMINS"
          ? "administrateurs"
          : audience === "BENEVOLES"
            ? "bénévoles"
            : "tous les utilisateurs";
      await this.logService.createLog({
        type: LogType.NOTIFICATION_MANUAL,
        message: `[${type}] → ${audienceLabel} : ${message}`,
        user: { connect: { id: senderUserId } },
        details: {
          notificationType: type,
          audience,
          recipientCount: users.length,
          body: message,
        },
      });
    } catch (e) {
      console.error("[NotificationDispatch] createLog manual:", e);
    }
  }

  private static notifTypeForStatus(status: TransponderStatus): NotificationType | null {
    switch (status) {
      case TransponderStatus.ATTRIBUE:
      case TransponderStatus.RECUPERE:
        return NotificationType.INFO;
      case TransponderStatus.DEFAILLANT:
        return NotificationType.ALERT;
      case TransponderStatus.PERDU:
        return NotificationType.EMERGENCY;
      default:
        return null;
    }
  }

  /**
   * À appeler après une opération transpondeur réussie (statut final connu).
   * N’interrompt pas le flux métier en cas d’erreur (journal uniquement).
   */
  async notifyAutomaticTransponderEvent(params: {
    newStatus: TransponderStatus;
    transponderNumero: number;
    transponderId: number;
    teamName?: string | null;
    actorUserId: number;
  }): Promise<void> {
    try {
      const notifType = NotificationDispatchService.notifTypeForStatus(params.newStatus);
      if (!notifType) {
        return;
      }
      const actor = await this.prisma.user.findUnique({
        where: { id: params.actorUserId },
        select: { firstName: true, lastName: true },
      });
      const who = actor ? `${actor.firstName} ${actor.lastName}`.trim() : "Un utilisateur";
      const teamPart = params.teamName ? ` — équipe « ${params.teamName} »` : "";
      let message: string;
      switch (params.newStatus) {
        case TransponderStatus.ATTRIBUE:
          message = `${who} a attribué le transpondeur n°${params.transponderNumero} (id ${params.transponderId})${teamPart}.`;
          break;
        case TransponderStatus.RECUPERE:
          message = `${who} a récupéré le transpondeur n°${params.transponderNumero} (id ${params.transponderId})${teamPart}.`;
          break;
        case TransponderStatus.DEFAILLANT:
          message = `${who} a déclaré le transpondeur n°${params.transponderNumero} (id ${params.transponderId}) défaillant${teamPart}.`;
          break;
        case TransponderStatus.PERDU:
          message = `${who} a déclaré le transpondeur n°${params.transponderNumero} (id ${params.transponderId}) perdu${teamPart}.`;
          break;
        default:
          return;
      }
      await this.dispatchToAdmins(notifType, message);
      try {
        await this.logService.createLog({
          type: LogType.NOTIFICATION_AUTOMATIC,
          message,
          user: { connect: { id: params.actorUserId } },
          details: {
            notificationType: notifType,
            transponderId: params.transponderId,
            transponderNumero: params.transponderNumero,
            teamName: params.teamName ?? undefined,
            newStatus: params.newStatus,
          },
        });
      } catch (logErr) {
        console.error("[NotificationDispatch] createLog auto:", logErr);
      }
    } catch (e) {
      console.error("[NotificationDispatch] notifyAutomaticTransponderEvent:", e);
    }
  }
}
