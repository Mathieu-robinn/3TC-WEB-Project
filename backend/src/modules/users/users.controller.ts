import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Prisma, Role, User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Public } from "../auth/public.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto.js";
import { UserService } from "./user.service.js";

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

  @ApiOperation({ summary: "Créer un utilisateur (public — provisioning)" })
  @ApiBody({ schema: { example: { email: "user@example.com", password: "password123", firstName: "Jean", lastName: "Dupont", role: "BENEVOLE" } } })
  @ApiResponse({ status: 201, description: "Utilisateur créé." })
  @Post("user")
  @Public()
  async signupUser(@Body() userData: CreateUserDto): Promise<User> {
    const data: Prisma.UserCreateInput = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role ?? Role.BENEVOLE,
    };
    return this.userService.createUser(data);
  }

  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @ApiParam({ name: "id", description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: "Utilisateur mis à jour." })
  @Put("user/:id")
  @Roles(Role.ADMIN)
  async updateUser(@Param("id") id: string, @Body() userData: UpdateUserDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      ...(userData.email !== undefined ? { email: userData.email } : {}),
      ...(userData.password !== undefined ? { password: userData.password } : {}),
      ...(userData.firstName !== undefined ? { firstName: userData.firstName } : {}),
      ...(userData.lastName !== undefined ? { lastName: userData.lastName } : {}),
      ...(userData.phone !== undefined ? { phone: userData.phone } : {}),
      ...(userData.role !== undefined ? { role: userData.role } : {}),
    };
    return this.userService.updateUser({ where: { id: Number(id) }, data });
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

