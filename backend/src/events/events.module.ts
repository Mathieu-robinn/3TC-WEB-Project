import { Module } from "@nestjs/common";
import { EventsGateway } from "./events.gateway.js";
import { AuthModule } from "../modules/auth/auth.module.js";
import { ConfigModule } from "@nestjs/config";

/**
 * EventsModule : Module qui expose le WebSocket Gateway.
 * Doit être importé dans AppModule pour être actif.
 */
@Module({
  imports: [AuthModule, ConfigModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
