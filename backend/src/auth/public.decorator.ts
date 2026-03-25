import { SetMetadata } from "@nestjs/common";

/**
 * Décorateur `@Public()` à utiliser sur les routes ou controllers
 * qui ne doivent pas nécessiter d'authentification.
 * Exemple: `@Get('editions') @Public() getAllEditions() {...}`
 */
export const Public = () => SetMetadata("isPublic", true);
