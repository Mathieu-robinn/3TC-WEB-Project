import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service.js";
import * as bcrypt from "bcrypt";

/**
 * AuthService : Gère l'inscription et la connexion des utilisateurs.
 * Les mots de passe sont hashés avec bcrypt avant d'être stockés en base.
 * À la connexion, un JWT signé est retourné au client, valable 24h.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Inscrit un nouvel utilisateur dans la base de données.
   * Le mot de passe est hashé avec bcrypt (10 rounds) avant insertion.
   * @param email Email unique de l'utilisateur
   * @param password Mot de passe en clair (sera hashé)
   * @param firstName Prénom
   * @param lastName Nom de famille
   */
  async register(email: string, password: string, firstName: string, lastName: string) {
    // Vérifier que l'email n'est pas déjà utilisé
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException("Un compte avec cet email existe déjà.");
    }

    // Hasher le mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur en base avec le mot de passe hashé
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName },
    });

    // Retourner directement un token (connexion automatique après inscription)
    return this.generateToken(user);
  }

  /**
   * Authentifie un utilisateur et retourne un JWT signé.
   * @param email Email de l'utilisateur
   * @param password Mot de passe en clair à comparer avec le hash stocké
   * @returns { accessToken: string } Le JWT à utiliser dans les headers Authorization
   */
  async login(email: string, password: string) {
    // Récupérer l'utilisateur par son email
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Email ou mot de passe incorrect.");
    }

    // Comparer le mot de passe fourni avec le hash stocké en base
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException("Email ou mot de passe incorrect.");
    }

    // Générer et retourner le JWT
    return this.generateToken(user);
  }

  /**
   * Génère un token JWT signé contenant les informations essentielles de l'utilisateur.
   * Le payload `sub` (subject) contient l'userId, utilisé par le JwtStrategy.
   */
  private generateToken(user: { id: number; email: string; role: string }) {
    const payload = {
      sub: user.id,       // Standard JWT claim: subject = userId
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
