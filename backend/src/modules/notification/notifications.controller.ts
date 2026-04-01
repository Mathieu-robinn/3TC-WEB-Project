import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NotificationType, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PrismaService } from "../../prisma.service.js";
import { NotificationDispatchService } from "./notification-dispatch.service.js";
import { assertSendAllowed, SendNotificationDto } from "./dto/send-notification.dto.js";
import { notificationToJson } from "./notification-json.util.js";

const TYPE_ORDER: Record<NotificationType, number> = {
  EMERGENCY: 0,
  ALERT: 1,
  INFO: 2,
};

const senderInclude = { select: { id: true, firstName: true, lastName: true, email: true } } as const;

@ApiTags("Notifications")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationDispatch: NotificationDispatchService,
  ) {}

  @ApiOperation({ summary: "Lister les notifications de l’utilisateur connecté (tri : urgence, alerte, info ; date décroissante)" })
  @ApiResponse({ status: 200 })
  @Get("notifications")
  async list(@Request() req: { user: { userId: number } }) {
    const rows = await this.prisma.notification.findMany({
      where: { userId: req.user.userId },
      include: { sender: senderInclude },
    });
    rows.sort((a, b) => {
      const ta = TYPE_ORDER[a.type];
      const tb = TYPE_ORDER[b.type];
      if (ta !== tb) return ta - tb;
      return b.date.getTime() - a.date.getTime();
    });
    return rows.map((n) => notificationToJson(n));
  }

  @ApiOperation({ summary: "Marquer une notification comme vue" })
  @Patch("notifications/:id/seen")
  async markSeen(
    @Request() req: { user: { userId: number } },
    @Param("id", ParseIntPipe) id: number,
  ) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId: req.user.userId },
    });
    if (!n) {
      throw new NotFoundException("Notification introuvable.");
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { state: "SEEN" },
      include: { sender: senderInclude },
    });
    return notificationToJson(updated);
  }

  @ApiOperation({ summary: "Marquer une notification comme traitée (marque aussi comme vue)" })
  @Patch("notifications/:id/processed")
  async markProcessed(
    @Request() req: { user: { userId: number } },
    @Param("id", ParseIntPipe) id: number,
  ) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId: req.user.userId },
    });
    if (!n) {
      throw new NotFoundException("Notification introuvable.");
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { processed: true, state: "SEEN" },
      include: { sender: senderInclude },
    });
    return notificationToJson(updated);
  }

  @ApiOperation({ summary: "Envoyer une notification manuelle (audience selon le rôle)" })
  @ApiBody({ type: SendNotificationDto })
  @Post("notifications/send")
  async send(
    @Request() req: { user: { userId: number; role: Role } },
    @Body() body: SendNotificationDto,
  ) {
    assertSendAllowed(req.user.role, body.audience);
    await this.notificationDispatch.dispatchToAudience(
      body.type,
      body.message,
      body.audience,
      req.user.userId,
    );
    return { ok: true };
  }
}
