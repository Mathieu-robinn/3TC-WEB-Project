import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

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
}

