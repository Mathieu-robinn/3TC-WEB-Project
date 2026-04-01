import { NotificationState, NotificationType } from "@prisma/client";

export type NotificationJson = {
  id: number;
  type: NotificationType;
  message: string;
  date: string;
  state: NotificationState;
  processed: boolean;
  sender: { id: number; firstName: string; lastName: string; email: string } | null;
};

type RowWithSender = {
  id: number;
  type: NotificationType;
  message: string;
  date: Date;
  state: NotificationState;
  processed: boolean;
  sender?: { id: number; firstName: string; lastName: string; email: string } | null;
};

export function notificationToJson(n: RowWithSender): NotificationJson {
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    date: n.date.toISOString(),
    state: n.state,
    processed: n.processed,
    sender: n.sender
      ? {
          id: n.sender.id,
          firstName: n.sender.firstName,
          lastName: n.sender.lastName,
          email: n.sender.email,
        }
      : null,
  };
}
