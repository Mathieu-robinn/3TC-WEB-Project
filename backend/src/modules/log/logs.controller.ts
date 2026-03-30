import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { QueryLogsDto } from "./dto/query-logs.dto.js";
import { LogService } from "./log.service.js";

@ApiTags("Logs")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class LogsController {
  constructor(private readonly logService: LogService) {}

  @Get("logs")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Lister les logs (pagination, filtres, tri)" })
  async list(@Query() query: QueryLogsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.logService.findPageForAdmin({
      skip,
      take: pageSize,
      types: query.type,
      userSearch: query.userSearch,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sort: query.sort ?? "desc",
    });
    return { items, total, page, pageSize };
  }

  @Get("logs/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Détail d’un log" })
  async getOne(@Param("id", ParseIntPipe) id: number) {
    const log = await this.logService.findByIdForAdmin(id);
    if (!log) {
      throw new NotFoundException(`Log #${id} introuvable.`);
    }
    return log;
  }
}
