import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { Role } from "@prisma/client";
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { LoginRateLimitService } from "./login-rate-limit.service.js";
import { Public } from "./public.decorator.js";
import { LoginDto, RegisterDto } from "./dto/auth.dto.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { RolesGuard } from "./roles.guard.js";
import { Roles } from "./roles.decorator.js";

/**
 * AuthController : login public, création de compte réservée aux admins.
 */
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginRateLimit: LoginRateLimitService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur.
   * Crée un compte sans connecter automatiquement le nouvel utilisateur.
   */
  @Post("register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Créer un compte utilisateur (admin)", description: "Le mot de passe est hashé avec bcrypt. Réservé aux administrateurs. Retourne uniquement le profil créé." })
  @ApiBody({ schema: { example: { email: "nouveau@24h.fr", password: "monMotDePasse", firstName: "Prénom", lastName: "Nom" } } })
  @ApiResponse({ status: 201, description: "Compte créé. Retourne le profil créé, sans mot de passe ni token." })
  @ApiResponse({ status: 403, description: "Réservé aux administrateurs." })
  @ApiResponse({ status: 401, description: "Email déjà utilisé." })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.firstName, body.lastName);
  }

  /**
   * Connexion avec email + mot de passe.
   * Retourne un JWT à utiliser dans le header Authorization: Bearer <token>
   */
  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Se connecter et obtenir un JWT", description: "Retourne un `accessToken` JWT à utiliser dans le header `Authorization: Bearer <token>`." })
  @ApiBody({ schema: { example: { email: "admin@24h-insa.fr", password: "monMotDePasse" } } })
  @ApiResponse({ status: 200, description: "Connexion réussie. Retourne { accessToken, user }." })
  @ApiResponse({ status: 401, description: "Email ou mot de passe incorrect." })
  @ApiResponse({ status: 429, description: "Trop de tentatives depuis cette adresse IP." })
  async login(@Req() req: Request, @Body() body: LoginDto) {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    this.loginRateLimit.assertAllowed(ip);
    return this.authService.login(body.email, body.password);
  }
}
