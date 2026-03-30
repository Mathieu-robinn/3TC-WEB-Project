import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service.js";
import { UserService } from "./modules/users/user.service.js";
import { EditionService } from "./modules/editions/edition.service.js";
import { CourseService } from "./modules/courses/course.service.js";
import { TeamService } from "./modules/teams/team.service.js";
import { RunnerService } from "./modules/runners/runner.service.js";
import { TransponderService } from "./modules/transponders/transponder.service.js";
import { TransponderTransactionService } from "./modules/transactions/transponder-transaction.service.js";
import { LogService } from "./modules/log/log.service.js";
import { NotificationService } from "./modules/notification/notification.service.js";
import { NotificationDispatchService } from "./modules/notification/notification-dispatch.service.js";
import { ConversationService } from "./modules/messaging/conversation.service.js";
import { MessageService } from "./modules/messaging/message.service.js";
import { ConversationParticipantService } from "./modules/messaging/conversation-participant.service.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { EventsModule } from "./events/events.module.js";
import { UsersController } from "./modules/users/users.controller.js";
import { EditionsController } from "./modules/editions/editions.controller.js";
import { CoursesController } from "./modules/courses/courses.controller.js";
import { TeamsController } from "./modules/teams/teams.controller.js";
import { RunnersController } from "./modules/runners/runners.controller.js";
import { TranspondersController } from "./modules/transponders/transponders.controller.js";
import { TransactionsController } from "./modules/transactions/transactions.controller.js";
import { MessagingController } from "./modules/messaging/messaging.controller.js";
import { NotificationsController } from "./modules/notification/notifications.controller.js";

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
  controllers: [
    UsersController,
    EditionsController,
    CoursesController,
    TeamsController,
    RunnersController,
    TranspondersController,
    TransactionsController,
    MessagingController,
    NotificationsController,
  ],
  providers: [
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
    NotificationDispatchService,
    ConversationService,
    MessageService,
    ConversationParticipantService,
  ],
})
export class AppModule {}
