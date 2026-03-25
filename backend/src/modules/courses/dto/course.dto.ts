import { Type } from "class-transformer";
import { IsDate, IsInt, IsNumber, IsString } from "class-validator";

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

