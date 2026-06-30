import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

// Store connection counts per IP for rate limiting
const connectionCounts = new Map<string, { count: number; resetTime: number }>();

function getClientIp(client: Socket): string {
  return (
    client.handshake.headers['x-forwarded-for'] as string ||
    client.handshake.headers['x-real-ip'] as string ||
    client.handshake.address ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = connectionCounts.get(ip);

  if (!record || now > record.resetTime) {
    connectionCounts.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }

  if (record.count >= 10) {
    return false; // Max 10 connections per minute per IP
  }

  record.count++;
  return true;
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Validate origin against allowed list
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  },
  namespace: '/notifications',
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit() {
    this.notificationsService.setGateway(this);
    this.logger.log('WebSocket Gateway initialized');
    
    // Cleanup connection counts periodically
    setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of connectionCounts.entries()) {
        if (now > record.resetTime) {
          connectionCounts.delete(ip);
        }
      }
    }, 60000);
  }

  async handleConnection(client: Socket) {
    const ip = getClientIp(client);

    // Rate limiting
    if (!checkRateLimit(ip)) {
      this.logger.warn(`WebSocket rate limit exceeded for IP: ${ip}`);
      client.disconnect();
      return;
    }

    try {
      const token =
        (client.handshake.auth.token as string) ||
        (client.handshake.query.token as string);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.ip = ip;
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub}, ip: ${ip})`);
    } catch (error) {
      this.logger.warn(`Unauthorized WebSocket connection: ${client.id} (ip: ${ip}) - ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} (user: ${client.data.userId})`);
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(client: Socket, notificationId: string) {
    if (client.data.userId) {
      await this.notificationsService.markRead(notificationId, client.data.userId);
    }
  }

  @SubscribeMessage('mark-all-read')
  async handleMarkAllRead(client: Socket) {
    if (client.data.userId) {
      await this.notificationsService.markAllRead(client.data.userId);
    }
  }

  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(client: Socket) {
    if (client.data.userId) {
      return this.notificationsService.getUnreadCount(client.data.userId);
    }
    return { count: 0 };
  }

  emitToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
