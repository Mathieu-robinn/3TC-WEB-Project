import { TransponderStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional } from "class-validator";

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
  @IsInt()
  teamId?: number | null;
}
