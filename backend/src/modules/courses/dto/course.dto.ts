import { Type } from "class-transformer";
import { IsDate, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCourseDto {
  @IsString()
  name: string;

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
