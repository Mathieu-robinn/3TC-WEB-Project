import { TransponderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  transponderId: number;

  @IsEnum(TransponderStatus)
  type: TransponderStatus;

  /** Obligatoire si `type` est `DONNE` (remise à une équipe). */
  @ValidateIf((o: CreateTransactionDto) => o.type === TransponderStatus.DONNE)
  @IsNotEmpty({ message: "L'équipe est requise pour une transaction de type DONNE." })
  @ValidateIf((o: CreateTransactionDto) => o.type !== TransponderStatus.DONNE)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}
