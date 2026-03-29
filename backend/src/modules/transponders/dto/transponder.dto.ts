import { TransponderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, ValidateIf } from "class-validator";

export class CreateTransponderDto {
  @IsOptional()
  @IsEnum(TransponderStatus)
  status?: TransponderStatus;
}

export class UpdateTransponderDto {
  @IsEnum(TransponderStatus)
  status: TransponderStatus;
}

export class AssignTransponderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number | null;

  /** Obligatoire lorsque `teamId` est défini : coureur de l'équipe qui reçoit la puce. */
  @ValidateIf((o: AssignTransponderDto) => o.teamId != null)
  @Type(() => Number)
  @IsInt()
  holderRunnerId?: number;
}
