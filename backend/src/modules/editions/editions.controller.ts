import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Edition, Prisma, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateEditionDto } from "./dto/edition.dto.js";
import { EditionService } from "./edition.service.js";

@ApiTags("Editions")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class EditionsController {
  constructor(private readonly editionService: EditionService) {}

  @ApiOperation({ summary: "Lister toutes les éditions (public)" })
  @ApiResponse({ status: 200, description: "Liste des éditions." })
  @Get("editions")
  @Public()
  async getAllEditions(): Promise<Edition[]> {
    return this.editionService.editions({});
  }

  @ApiOperation({ summary: "Créer une nouvelle édition" })
  @ApiBody({ schema: { example: { name: "24h INSA 2027", active: false, startDate: "2027-05-15T18:00:00Z", endDate: "2027-05-17T18:00:00Z" } } })
  @ApiResponse({ status: 201, description: "Édition créée." })
  @Post("edition")
  @Roles(Role.ADMIN)
  async createEdition(@Body() data: CreateEditionDto): Promise<Edition> {
    const prismaData: Prisma.EditionCreateInput = {
      name: data.name,
      active: data.active,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    return this.editionService.createEdition(prismaData);
  }

  @ApiOperation({ summary: "Définir l’édition active (les autres passent à inactive)" })
  @ApiParam({ name: "id", description: "ID de l’édition à activer" })
  @ApiResponse({ status: 200, description: "Édition activée." })
  @Patch("edition/:id/activate")
  @Roles(Role.ADMIN)
  async activateEdition(@Param("id") id: string): Promise<Edition> {
    return this.editionService.setActiveEdition(Number(id));
  }
}

