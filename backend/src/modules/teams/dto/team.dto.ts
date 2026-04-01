import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, ValidateIf } from "class-validator";

export class CreateTeamDto {
  @Type(() => Number)
  @IsInt()
  num: number;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  courseId: number;
}

export class UpdateTeamDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  num?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  nbTour?: number;

  /** Capitaine : doit être un coureur de l'équipe ; `null` retire le capitaine. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  respRunnerId?: number | null;
}

