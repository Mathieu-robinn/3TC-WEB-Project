import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, ValidateIf } from "class-validator";

export class CreateRunnerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @Type(() => Number)
  @IsInt()
  teamId: number;
}

export class UpdateRunnerDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsString()
  phone?: string | null;

  /** Absent = ne pas modifier ; nombre = changer d'équipe (désattacher interdit). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}
