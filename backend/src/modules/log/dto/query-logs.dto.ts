import { Transform, Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { LogType } from "@prisma/client";

function parseLogTypes(value: unknown): LogType[] | undefined {
  if (value == null || value === "") return undefined;
  const arr = Array.isArray(value) ? value : String(value).split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length ? (arr as LogType[]) : undefined;
}

export class QueryLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  userSearch?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sort: "asc" | "desc" = "desc";

  @IsOptional()
  @Transform(({ value }) => parseLogTypes(value))
  @IsArray()
  @IsEnum(LogType, { each: true })
  type?: LogType[];
}
