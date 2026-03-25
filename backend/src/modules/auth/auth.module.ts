import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { PrismaService } from "../../prisma.service.js";

/**
 * AuthModule : Gère l'ensemble du système d'authentification.
 * Utilise JwtModule.registerAsync pour lire JWT_SECRET après chargement du .env.
 */
@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: (() => {
          const secret = config.get<string>("JWT_SECRET");
          if (!secret) {
            throw new Error("JWT_SECRET is required");
          }
          return secret;
        })(),
        signOptions: { expiresIn: (config.get<string>("JWT_EXPIRES_IN") ?? "24h") as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, PrismaService],
  exports: [JwtModule],
})
export class AuthModule {}
