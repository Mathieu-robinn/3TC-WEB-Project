import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role, User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto.js";
import { UserPublic, UserService } from "./user.service.js";

@ApiTags("Users")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "Récupérer un utilisateur par ID" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur", example: 1 })
  @ApiResponse({ status: 200, description: "Utilisateur trouvé." })
  @Get("user/:id")
  async getUserById(@Param("id") id: string): Promise<User | null> {
    return this.userService.user({ id: Number(id) });
  }

  @ApiOperation({
    summary: "Lister les comptes (admin)",
    description: "Retourne tous les utilisateurs sans le mot de passe. Réservé aux administrateurs.",
  })
  @ApiResponse({ status: 200, description: "Liste des utilisateurs." })
  @Get("users")
  @Roles(Role.ADMIN)
  async listUsers(): Promise<UserPublic[]> {
    return this.userService.listStaffAccounts();
  }

  @ApiOperation({
    summary: "Créer un compte administrateur ou bénévole",
    description:
      "Crée un utilisateur avec mot de passe hashé (bcrypt). Réservé aux administrateurs. L’email doit être unique.",
  })
  @ApiBody({ schema: { example: { email: "user@example.com", password: "password123", firstName: "Jean", lastName: "Dupont", role: "BENEVOLE" } } })
  @ApiResponse({ status: 201, description: "Utilisateur créé (sans champ mot de passe)." })
  @ApiResponse({ status: 409, description: "Email déjà utilisé." })
  @Post("user")
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  async createStaffUser(@Body() userData: CreateUserDto): Promise<UserPublic> {
    return this.userService.createStaffUser(userData);
  }

  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur mis à jour." })
  @Put("user/:id")
  @Roles(Role.ADMIN)
  async updateUser(@Param("id") id: string, @Body() userData: UpdateUserDto): Promise<UserPublic> {
    return this.userService.updateStaffUser(Number(id), userData);
  }

  @ApiOperation({ summary: "Supprimer un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur supprimé." })
  @Delete("user/:id")
  @Roles(Role.ADMIN)
  async deleteUser(@Param("id") id: string): Promise<User> {
    return this.userService.deleteUser({ id: Number(id) });
  }
}

