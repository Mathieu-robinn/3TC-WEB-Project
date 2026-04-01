import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { NotificationJson } from "../modules/notification/notification-json.util.js";

/**
 * EventsGateway : Passerelle WebSocket pour la messagerie en temps réel et les notifications.
 * Les clients peuvent se connecter à ws://localhost:3000 et envoyer/recevoir des événements.
 * Utilisé pour le chat entre organisateurs et pour dispatcher les notifications.
 */
@WebSocketGateway({
  cors: {
    origin: "*", // À restreindre à l'URL du frontend en production
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** L'instance du serveur Socket.IO injectée par NestJS */
  @WebSocketServer()
  server: Server;

  /** Mappe userId -> sockets (plusieurs onglets / appareils par utilisateur) */
  private connectedUsers = new Map<number, Set<string>>();

  /**
   * Appelé automatiquement quand un client se connecte.
   * Authentifie le client via JWT (handshake.auth.token ou Authorization header).
   */
  handleConnection(client: Socket) {
    const authToken =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization?.startsWith("Bearer ")
        ? client.handshake.headers.authorization.slice("Bearer ".length)
        : undefined);
    const secret = this.configService.get<string>("JWT_SECRET");

    if (!authToken || !secret) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: number }>(authToken, { secret });
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }
      let sockets = this.connectedUsers.get(payload.sub);
      if (!sockets) {
        sockets = new Set<string>();
        this.connectedUsers.set(payload.sub, sockets);
      }
      sockets.add(client.id);
      console.log(`[WS] Utilisateur ${payload.sub} connecté (socket: ${client.id})`);
    } catch {
      client.disconnect(true);
    }
  }

  /**
   * Appelé automatiquement quand un client se déconnecte.
   */
  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.connectedUsers.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
        console.log(`[WS] Utilisateur ${userId} déconnecté (socket: ${client.id})`);
        break;
      }
    }
  }

  /**
   * Écoute l'événement 'sendMessage' émis par un client.
   * Rebroadcast le message à tous les participants de la conversation.
   * @param payload { conversationId: number, senderUserId: number, content: string }
   */
  @SubscribeMessage("sendMessage")
  handleMessage(
    @MessageBody() payload: { conversationId: number; senderUserId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Émet le message à tous les utilisateurs connectés dans la conversation
    this.server.emit(`conversation:${payload.conversationId}:newMessage`, {
      senderUserId: payload.senderUserId,
      content: payload.content,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Permet d'envoyer une notification ciblée à un utilisateur spécifique.
   * Appelable depuis n'importe quel service NestJS via injection.
   */
  sendNotificationToUser(userId: number, notification: NotificationJson) {
    const sockets = this.connectedUsers.get(userId);
    if (!sockets?.size) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit("newNotification", notification);
    }
  }
}
