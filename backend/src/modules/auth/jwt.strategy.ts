import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

/**
 * Stratégie JWT NestJS/Passport.
 * Elle est utilisée pour valider les tokens Bearer émis par le provider OIDC du frontend (nuxt-oidc-auth).
 * Elle extrait le token depuis le header `Authorization: Bearer <token>`,
 * et si la signature est valide, elle retourne le payload décodé
 * qui sera disponible dans `request.user` pour toutes les routes protégées.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required");
    }

    super({
      // Extrait le token depuis le header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // On fait confiance à la signature basée sur le secret JWT configuré dans le .env
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Une fois le token validé par Passport, cette méthode est appelée avec le payload décodé.
   * La valeur retournée sera disponible en tant que `request.user` dans les controllers.
   * @param payload Le contenu décodé du JWT (sub = userId, email, role, etc.)
   */
  async validate(payload: { sub: number; email: string; role: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException("Token invalide : sub manquant");
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
