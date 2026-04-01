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
