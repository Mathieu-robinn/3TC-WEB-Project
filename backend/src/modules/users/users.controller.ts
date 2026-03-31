import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role, User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateUserDto, UpdateMyProfileDto, UpdateUserDto } from "./dto/user.dto.js";
import { PasswordChangeRateLimitService } from "./password-change-rate-limit.service.js";
import { UserPublic, UserService } from "./user.service.js";

@ApiTags("Users")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordChangeRateLimit: PasswordChangeRateLimitService,
  ) {}

  @ApiOperation({ summary: "Récupérer un utilisateur par ID" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur", example: 1 })
  @ApiResponse({ status: 200, description: "Utilisateur trouvé sans le champ mot de passe." })
  @Get("user/:id")
  async getUserById(
    @Param("id") id: string,
    @Request() req: { user: { userId: number; role: Role } },
  ): Promise<UserPublic | null> {
    const targetUserId = Number(id);
    const isSelf = req.user.userId === targetUserId;
    const isAdmin = req.user.role === Role.ADMIN;
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException("Vous ne pouvez consulter que votre propre profil.");
    }
    return this.userService.publicUser({ id: targetUserId });
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
  async createStaffUser(
    @Body() userData: CreateUserDto,
    @Request() req: { user: { userId: number } },
  ): Promise<UserPublic> {
    return this.userService.createStaffUser(userData, req.user.userId);
  }

  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur mis à jour." })
  @Put("user/:id")
  @Roles(Role.ADMIN)
  async updateUser(@Param("id") id: string, @Body() userData: UpdateUserDto): Promise<UserPublic> {
    return this.userService.updateStaffUser(Number(id), userData);
  }

  @ApiOperation({ summary: "Mettre à jour son propre compte" })
  @ApiResponse({ status: 200, description: "Compte courant mis à jour." })
  @Put("me")
  async updateOwnProfile(
    @Request() req: ExpressRequest & { user: { userId: number; role: Role } },
    @Body() userData: UpdateMyProfileDto,
  ): Promise<UserPublic> {
    if (userData.currentPassword !== undefined || userData.newPassword !== undefined) {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      this.passwordChangeRateLimit.assertAllowed(`${req.user.userId}:${ip}`);
    }
    return this.userService.updateOwnProfile(req.user.userId, req.user.role, userData);
  }

  @ApiOperation({ summary: "Supprimer un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur supprimé." })
  @Delete("user/:id")
  @Roles(Role.ADMIN)
  async deleteUser(
    @Request() req: { user: { userId: number } },
    @Param("id") id: string,
  ): Promise<User> {
    return this.userService.deleteStaffUser(req.user.userId, Number(id));
  }
}

