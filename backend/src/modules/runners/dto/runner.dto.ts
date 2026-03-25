import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}

