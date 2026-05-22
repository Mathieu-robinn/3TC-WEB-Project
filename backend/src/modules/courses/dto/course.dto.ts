import { CourseCategory } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ValidateIf((o: CreateCourseDto) => o.category === CourseCategory.PERSONNALISE)
  @IsString()
  customCategoryName?: string;

  @IsNumber()
  distanceTour: number;

  @Type(() => Date)
  @IsDate()
  dateAndTime: Date;

  @Type(() => Number)
  @IsInt()
  editionId: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsOptional()
  @IsString()
  customCategoryName?: string;

  @IsOptional()
  @IsNumber()
  distanceTour?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateAndTime?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  editionId?: number;
}
