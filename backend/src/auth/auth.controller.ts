import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { Public } from "./public.decorator.js";

/**
 * AuthController : Authentification — toutes les routes sont publiques.
 */
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscription d'un nouvel utilisateur.
   * Retourne directement un JWT (connexion automatique).
   */
  @Post("register")
  @Public()
  @ApiOperation({ summary: "Créer un compte utilisateur", description: "Le mot de passe est hashé avec bcrypt. Retourne un JWT valable 24h." })
  @ApiBody({ schema: { example: { email: "nouveau@24h.fr", password: "monMotDePasse", firstName: "Prénom", lastName: "Nom" } } })
  @ApiResponse({ status: 201, description: "Compte créé. Retourne { accessToken, user }." })
  @ApiResponse({ status: 401, description: "Email déjà utilisé." })
  async register(@Body() body: { email: string; password: string; firstName: string; lastName: string }) {
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
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
