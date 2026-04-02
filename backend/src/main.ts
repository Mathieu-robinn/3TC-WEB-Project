import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Configuration CORS ────────────────────────────────────────────────────
  // Permet au frontend Nuxt (port 3001 / autre) de communiquer avec l'API
  const corsOriginRaw = process.env.CORS_ORIGIN;
  const corsOrigins = corsOriginRaw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!corsOrigins || corsOrigins.length === 0)) {
    throw new Error("CORS_ORIGIN is required in production");
  }

  app.enableCors({ origin: corsOrigins?.length ? corsOrigins : "*" });

  // ─── Hardening ─────────────────────────────────────────────────────────────
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Configuration Swagger ─────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle("24h INSA API")
    .setDescription(
      `API REST du projet 24h INSA.\n\n` +
      `**Authentification** : La plupart des routes nécessitent un token JWT.\n` +
      `Utilisez \`POST /auth/login\` pour obtenir un token, puis cliquez sur **Authorize** et entrez \`Bearer <token>\`.`
    )
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Entrez votre JWT ici" },
      "JWT-auth", // Nom de la security scheme, utilisé dans @ApiBearerAuth()
    )
    .addTag("Auth", "Authentification (login / register)")
    .addTag("Users", "Gestion des utilisateurs")
    .addTag("Editions", "Gestion des éditions de la course")
    .addTag("Courses", "Gestion des parcours")
    .addTag("Teams", "Gestion des équipes & classements")
    .addTag("Runners", "Gestion des coureurs")
    .addTag("Transponders", "Gestion des puces de chronométrage")
    .addTag("Transactions", "Historique des distributions de puces")
    .addTag("Notifications", "Centre de notifications et alertes")
    .addTag("Messaging", "Messagerie interne (conversations et messages)")
    .addTag("Logs", "Journal d’audit (admin)")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Interface Swagger disponible à http://localhost:3000/docs
  SwaggerModule.setup("docs", app, document, {
    // Titre de l'onglet navigateur
    customSiteTitle: "24h INSA — API Docs",
    // Favicon personnalisé (logo INSA)
    customfavIcon: "https://www.insa-lyon.fr/sites/all/themes/insa/favicon.ico",
    // CSS pour remplacer le logo Swagger par le logo 24h INSA
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; padding: 10px 20px; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before {
        content: "🏃 24h INSA";
        color: #ffffff;
        font-size: 1.8rem;
        font-weight: 700;
        font-family: 'Segoe UI', sans-serif;
        letter-spacing: 1px;
      }
      .swagger-ui .topbar a { pointer-events: none; }
      .swagger-ui .info .title { color: #1a1a2e; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Garde le token entre les rechargements de page
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API démarrée sur http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger disponible sur http://localhost:${process.env.PORT ?? 3000}/docs`);
}

bootstrap();
