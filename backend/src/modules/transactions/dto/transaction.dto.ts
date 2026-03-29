import { TransponderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  transponderId: number;

  @IsEnum(TransponderStatus)
  type: TransponderStatus;

  /** Obligatoire si `type` est `ATTRIBUE` (attribution à une équipe). */
  @ValidateIf((o: CreateTransactionDto) => o.type === TransponderStatus.ATTRIBUE)
  @IsNotEmpty({ message: "L'équipe est requise pour une transaction de type ATTRIBUE." })
  @ValidateIf((o: CreateTransactionDto) => o.type !== TransponderStatus.ATTRIBUE)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}
