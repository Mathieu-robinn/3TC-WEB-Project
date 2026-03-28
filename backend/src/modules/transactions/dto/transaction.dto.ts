import { TransponderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional } from "class-validator";

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  transponderId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;

  @IsEnum(TransponderStatus)
  type: TransponderStatus;
}

