import { LogType, TransponderStatus } from "@prisma/client";

export function logTypeForTransponderAudit(status: TransponderStatus): LogType | null {
  switch (status) {
    case TransponderStatus.ATTRIBUE:
      return LogType.GIVE_TRANSPONDER;
    case TransponderStatus.RECUPERE:
      return LogType.RETURN_TRANSPONDER;
    case TransponderStatus.PERDU:
      return LogType.LOOSE_TRANSPONDER;
    default:
      return null;
  }
}

export function transponderAuditMessage(
  status: TransponderStatus,
  numero: number,
  id: number,
  teamName?: string | null,
): string {
  const teamPart = teamName ? ` — équipe « ${teamName} »` : "";
  switch (status) {
    case TransponderStatus.ATTRIBUE:
      return `Attribution du transpondeur n°${numero} (id ${id})${teamPart}.`;
    case TransponderStatus.RECUPERE:
      return `Récupération du transpondeur n°${numero} (id ${id})${teamPart}.`;
    case TransponderStatus.PERDU:
      return `Transpondeur n°${numero} (id ${id}) déclaré perdu${teamPart}.`;
    default:
      return `Transpondeur n°${numero} (id ${id}) — statut ${status}.`;
  }
}
