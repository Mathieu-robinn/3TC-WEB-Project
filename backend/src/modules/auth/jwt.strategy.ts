import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma.service.js";

/**
 * Stratégie JWT NestJS/Passport.
 * Elle est utilisée pour valider les tokens Bearer émis par le provider OIDC du frontend (nuxt-oidc-auth).
 * Elle extrait le token depuis le header `Authorization: Bearer <token>`,
 * et si la signature est valide, elle retourne le payload décodé
 * qui sera disponible dans `request.user` pour toutes les routes protégées.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
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
   * On recharge l'utilisateur en base pour garantir que `userId` existe (clé étrangère des audits, etc.)
   * et pour invalider les jetons émis avant un reset / reseed de la base.
   * @param payload Le contenu décodé du JWT (sub = userId, email, role, etc.)
   */
  async validate(payload: { sub?: number | string; email?: string; role?: string; tokenVersion?: number | string }) {
    const raw = payload.sub;
    const userId = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
    if (raw === undefined || raw === null || Number.isNaN(userId) || userId < 1) {
      throw new UnauthorizedException("Token invalide : sub manquant ou incorrect");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!user) {
      throw new UnauthorizedException("Session invalide : reconnectez-vous.");
    }

    const tokenVersion =
      payload.tokenVersion === undefined || payload.tokenVersion === null
        ? null
        : typeof payload.tokenVersion === "string"
          ? Number.parseInt(payload.tokenVersion, 10)
          : Number(payload.tokenVersion);
    if (tokenVersion === null || Number.isNaN(tokenVersion) || tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException("Session expirée : reconnectez-vous.");
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
