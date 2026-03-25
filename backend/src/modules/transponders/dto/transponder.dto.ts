import { TransponderStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class CreateTransponderDto {
  @IsOptional()
  @IsEnum(TransponderStatus)
  status?: TransponderStatus;
}

export class UpdateTransponderDto {
  @IsEnum(TransponderStatus)
  status: TransponderStatus;
}

