import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, Transponder } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateTransponderDto, UpdateTransponderDto } from "./dto/transponder.dto.js";
import { TransponderService } from "./transponder.service.js";

@ApiTags("Transponders")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class TranspondersController {
  constructor(private readonly transponderService: TransponderService) {}

  @ApiOperation({ summary: "Lister tous les transpondeurs" })
  @ApiResponse({ status: 200, description: "Liste des puces." })
  @ApiResponse({ status: 401, description: "Token JWT requis." })
  @Get("transponders")
  async getAllTransponders(): Promise<Transponder[]> {
    return this.transponderService.transponders({});
  }

  @ApiOperation({ summary: "Statistiques des puces par statut" })
  @ApiResponse({ status: 200, description: "Exemple: { NEW: 8, IN: 10, OUT: 15, LOST: 7 }" })
  @Get("transponders/stats")
  async getTransponderStats(): Promise<Record<string, number>> {
    const transponders = await this.transponderService.transponders({});
    const stats: Record<string, number> = { NEW: 0, IN: 0, OUT: 0, LOST: 0 };
    for (const t of transponders) {
      stats[t.status] = (stats[t.status] ?? 0) + 1;
    }
    return stats;
  }

  @ApiOperation({ summary: "Créer un nouveau transpondeur" })
  @ApiBody({ schema: { example: { status: "NEW" } } })
  @Post("transponder")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async createTransponder(@Body() data: CreateTransponderDto): Promise<Transponder> {
    const prismaData: Prisma.TransponderCreateInput = {
      status: data.status ?? "NEW",
    };
    return this.transponderService.createTransponder(prismaData);
  }

  @ApiOperation({ summary: "Mettre à jour le statut d'un transpondeur" })
  @ApiParam({ name: "id", description: "ID du transpondeur" })
  @ApiBody({ schema: { example: { status: "LOST" } } })
  @Put("transponder/:id")
  @Roles(Role.ADMIN, Role.BENEVOLE)
  async updateTransponder(@Param("id") id: string, @Body() data: UpdateTransponderDto): Promise<Transponder> {
    const prismaData: Prisma.TransponderUpdateInput = { status: data.status };
    return this.transponderService.updateTransponder({ where: { id: Number(id) }, data: prismaData });
  }
}

