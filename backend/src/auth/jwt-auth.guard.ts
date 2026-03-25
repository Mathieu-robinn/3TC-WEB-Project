import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";

/**
 * Guard JWT réutilisable basé sur la stratégie Passport 'jwt'.
 * À appliquer sur n'importe quelle route avec le décorateur `@UseGuards(JwtAuthGuard)`.
 * Il s'appuie sur `JwtStrategy` pour valider le token (signature, expiration).
 * Si le token est absent ou invalide, retourne un 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Permet de décorer certaines routes avec `@Public()` pour les rendre publiques 
   * (non protégées par le guard). Toutes les autres routes requièrent un JWT valide.
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err ?? new UnauthorizedException("Authentification requise. Veuillez fournir un token JWT valide.");
    }
    return user;
  }
}
