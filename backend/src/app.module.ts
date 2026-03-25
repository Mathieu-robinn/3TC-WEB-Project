import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service.js";
import { UserService } from "./user.service.js";
import { EditionService } from "./edition.service.js";
import { CourseService } from "./course.service.js";
import { TeamService } from "./team.service.js";
import { RunnerService } from "./runner.service.js";
import { TransponderService } from "./transponder.service.js";
import { TransponderTransactionService } from "./transponder-transaction.service.js";
import { LogService } from "./log.service.js";
import { NotificationService } from "./notification.service.js";
import { ConversationService } from "./conversation.service.js";
import { MessageService } from "./message.service.js";
import { ConversationParticipantService } from "./conversation-participant.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { EventsModule } from "./events/events.module.js";

/**
 * AppModule : Module racine qui registre tous les modules, contrôleurs et services.
 * - AuthModule : Gestion de l'authentification JWT (Passport)
 * - EventsModule : WebSocket Gateway pour le chat et les notifications en temps réel
 */
@Module({
  imports: [
    // Charge les variables d'environnement (.env) pour toute l'application
    ConfigModule.forRoot(),
    // Module d'authentification JWT (valide les tokens OIDC du frontend)
    AuthModule,
    // Module WebSocket pour la messagerie et les notifications en temps réel
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    UserService,
    EditionService,
    CourseService,
    TeamService,
    RunnerService,
    TransponderService,
    TransponderTransactionService,
    LogService,
    NotificationService,
    ConversationService,
    MessageService,
    ConversationParticipantService,
  ],
})
export class AppModule {}
