import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsString } from "class-validator";

export class CreateEditionDto {
  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

