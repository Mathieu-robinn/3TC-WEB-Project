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

/**
 * EventsGateway : Passerelle WebSocket pour la messagerie en temps réel et les notifications.
 * Les clients peuvent se connecter à ws://localhost:3000 et envoyer/recevoir des événements.
 * Utilisé pour le chat entre organisateurs et pour dispatcher les notifications.
 */
@WebSocketGateway({
  cors: {
    origin: "*", // À restreindre à l'URL du frontend en production
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** L'instance du serveur Socket.IO injectée par NestJS */
  @WebSocketServer()
  server: Server;

  /** Mappe userId -> socketId pour tracker les utilisateurs connectés */
  private connectedUsers = new Map<number, string>();

  /**
   * Appelé automatiquement quand un client se connecte.
   * On peut extraire l'userId depuis le token JWT passé dans la query string ou les headers.
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.connectedUsers.set(Number(userId), client.id);
      console.log(`[WS] Utilisateur ${userId} connecté (socket: ${client.id})`);
    }
  }

  /**
   * Appelé automatiquement quand un client se déconnecte.
   */
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`[WS] Utilisateur ${userId} déconnecté`);
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
   * @param userId L'ID de l'utilisateur cible
   * @param notification L'objet de notification à envoyer
   */
  sendNotificationToUser(userId: number, notification: { message: string; date: string; state: string }) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit("newNotification", notification);
    }
  }
}
