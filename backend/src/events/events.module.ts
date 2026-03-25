import { Module } from "@nestjs/common";
import { EventsGateway } from "./events.gateway.js";

/**
 * EventsModule : Module qui expose le WebSocket Gateway.
 * Doit être importé dans AppModule pour être actif.
 */
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
