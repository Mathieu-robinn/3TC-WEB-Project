import { ForbiddenException } from "@nestjs/common";
import { NotificationType, Role } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import type { NotificationAudience } from "../notification-dispatch.service.js";

export class SendNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsEnum(["ADMINS", "BENEVOLES", "ALL"] as const)
  audience: NotificationAudience;
}

export function assertSendAllowed(role: Role, audience: NotificationAudience): void {
  if (role === Role.BENEVOLE && audience !== "ADMINS") {
    throw new ForbiddenException("Les bénévoles ne peuvent envoyer une notification qu’aux administrateurs.");
  }
}
