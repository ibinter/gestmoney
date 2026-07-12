import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * AppGateway — WebSocket Gateway principal GESTMONEY
 *
 * Namespaces (configurés côté client) :
 *   /dashboard    — abonnement aux stats dashboard temps réel
 *   /transactions — réception des nouvelles transactions et mises à jour
 *   /float        — alertes de float et mises à jour de solde
 *   /notifications — notifications personnelles utilisateur
 *
 * Authentification :
 *   Le token JWT doit être passé lors de la connexion :
 *   io('ws://host', { auth: { token: 'Bearer <jwt>' } })
 *   ou via query param : io('ws://host?token=<jwt>')
 *
 * Isolation multi-tenant :
 *   Chaque tenant a sa propre room Socket.io : `tenant:<tenantId>`
 *   Un utilisateur rejoint automatiquement la room de son tenant à la connexion.
 *   Sa room personnelle : `user:<userId>`
 *
 * Événements émis vers le client :
 *   transaction:new      — nouvelle transaction créée
 *   transaction:updated  — statut d'une transaction modifié
 *   float:alert          — alerte float (seuil bas atteint)
 *   float:updated        — solde float mis à jour
 *   fraud:alert          — alerte fraude détectée
 *   notification:new     — nouvelle notification pour l'utilisateur
 *   dashboard:stats      — statistiques dashboard (toutes les 30s)
 *   agent:status         — changement de statut d'un agent
 *   system:alert         — alerte système critique
 *
 * Événements reçus du client :
 *   subscribe:dashboard  — s'abonner aux stats dashboard du tenant
 *   subscribe:agent      — s'abonner aux événements d'un agent spécifique
 *   ping                 → répond pong (keepalive)
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  /** Map userId → Set<socketId> pour retrouver les sockets d'un utilisateur */
  private userSockets = new Map<string, Set<string>>();

  /** Map socketId → JwtPayload pour accès rapide au contexte utilisateur */
  private socketContext = new Map<string, JwtPayload>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialisé');

    // Middleware d'authentification JWT appliqué à toutes les connexions
    server.use((socket: Socket, next) => {
      try {
        const token =
          (socket.handshake.auth?.token as string) ||
          (socket.handshake.query?.token as string);

        if (!token) {
          return next(new WsException('Token JWT manquant'));
        }

        const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const payload = this.jwtService.verify<JwtPayload>(rawToken);

        // Stocker le payload dans les données du socket pour y accéder ensuite
        (socket as any).user = payload;
        next();
      } catch (err) {
        next(new WsException('Token JWT invalide ou expiré'));
      }
    });
  }

  handleConnection(socket: Socket) {
    const user: JwtPayload = (socket as any).user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const tenantRoom = `tenant:${user.tenantId}`;
    const userRoom = `user:${user.sub}`;

    // Rejoindre les rooms d'isolation
    socket.join(tenantRoom);
    socket.join(userRoom);

    // Indexer le socket
    this.socketContext.set(socket.id, user);
    if (!this.userSockets.has(user.sub)) {
      this.userSockets.set(user.sub, new Set());
    }
    this.userSockets.get(user.sub)!.add(socket.id);

    this.logger.log(
      `Client connecté — socket: ${socket.id} | user: ${user.email} | tenant: ${user.tenantId}`,
    );

    // Confirmer la connexion au client
    socket.emit('connected', {
      socketId: socket.id,
      userId: user.sub,
      tenantId: user.tenantId,
      timestamp: new Date().toISOString(),
    });

    // Émettre le changement de statut agent si applicable
    if (user.agentId) {
      this.server.to(tenantRoom).emit('agent:status', {
        agentId: user.agentId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(socket: Socket) {
    const user = this.socketContext.get(socket.id);
    if (user) {
      // Nettoyer les index
      this.socketContext.delete(socket.id);
      const userSocketSet = this.userSockets.get(user.sub);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(user.sub);
        }
      }

      this.logger.log(
        `Client déconnecté — socket: ${socket.id} | user: ${user.email}`,
      );

      // Émettre statut offline pour l'agent si c'était sa dernière connexion
      if (user.agentId && !this.userSockets.has(user.sub)) {
        this.server.to(`tenant:${user.tenantId}`).emit('agent:status', {
          agentId: user.agentId,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // ─── Événements reçus du client ──────────────────────────────────────────

  @SubscribeMessage('subscribe:dashboard')
  handleSubscribeDashboard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    const user: JwtPayload = (socket as any).user;
    // Déjà dans la room tenant, confirmer l'abonnement
    socket.emit('subscribed', {
      channel: 'dashboard',
      tenantId: user.tenantId,
    });
    this.logger.debug(`${user.email} abonné au dashboard`);
  }

  @SubscribeMessage('subscribe:agent')
  handleSubscribeAgent(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { agentId: string },
  ) {
    const user: JwtPayload = (socket as any).user;
    if (data?.agentId) {
      const agentRoom = `agent:${data.agentId}`;
      socket.join(agentRoom);
      socket.emit('subscribed', {
        channel: 'agent',
        agentId: data.agentId,
      });
      this.logger.debug(`${user.email} abonné à l'agent ${data.agentId}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  }

  // ─── Helpers d'accès au serveur (utilisés par GatewayService) ────────────

  getServer(): Server {
    return this.server;
  }

  getConnectedUsersCount(tenantId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`tenant:${tenantId}`);
    return room ? room.size : 0;
  }
}
