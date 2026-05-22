import { CourseCategory } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class ImportParticipantRowDto {
  @Type(() => Number)
  @IsInt()
  lineNumber: number;

  @IsString()
  courseName: string;

  @IsEnum(CourseCategory)
  category: CourseCategory;

  @IsString()
  teamName: string;

  @IsString()
  lastName: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isCaptain?: boolean;
}

export class ImportParticipantsBodyDto {
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportParticipantRowDto)
  rows: ImportParticipantRowDto[];
}
