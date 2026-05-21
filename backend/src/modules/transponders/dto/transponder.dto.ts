import { TransponderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from "class-validator";

export class CreateTransponderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numero: number;

  @IsOptional()
  @IsEnum(TransponderStatus)
  status?: TransponderStatus;
}

export class CreateTranspondersBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  numeros: number[];
}

export class DeleteTranspondersBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids: number[];
}

export class UpdateTransponderDto {
  @IsEnum(TransponderStatus)
  status: TransponderStatus;
}

export class LinkTransponderTeamDto {
  @Type(() => Number)
  @IsInt()
  teamId: number;
}

export class AssignTransponderDto {
  @Type(() => Number)
  @IsInt()
  teamId: number;

  /** Coureur de l'équipe qui reçoit la puce (remise physique). */
  @Type(() => Number)
  @IsInt()
  holderRunnerId: number;
}
