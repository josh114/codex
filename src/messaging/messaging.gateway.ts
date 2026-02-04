import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from './redis.service';

interface DirectMessagePayload {
  toUserId: string;
  content: string;
}

interface GroupMessagePayload {
  groupId: string;
  content: string;
}

interface JoinGroupPayload {
  groupId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = this.getUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    await this.redisService.addSocket(userId, client.id);
    client.join(`user:${userId}`);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.getUserId(client);
    if (userId) {
      await this.redisService.removeSocket(userId, client.id);
    }
  }

  @SubscribeMessage('direct_message')
  async handleDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DirectMessagePayload,
  ): Promise<{ delivered: boolean } | { error: string }> {
    const fromUserId = this.getUserId(client);
    if (!fromUserId) {
      return { error: 'Missing user identity.' };
    }

    const sockets = await this.redisService.getSockets(payload.toUserId);
    if (sockets.length === 0) {
      return { delivered: false };
    }

    this.server.to(sockets).emit('direct_message', {
      fromUserId,
      content: payload.content,
      sentAt: new Date().toISOString(),
    });

    return { delivered: true };
  }

  @SubscribeMessage('join_group')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinGroupPayload,
  ): Promise<{ joined: string }> {
    const groupRoom = this.groupRoom(payload.groupId);
    await client.join(groupRoom);
    return { joined: groupRoom };
  }

  @SubscribeMessage('group_message')
  async handleGroupMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GroupMessagePayload,
  ): Promise<{ delivered: boolean }> {
    const fromUserId = this.getUserId(client) ?? 'unknown';
    const groupRoom = this.groupRoom(payload.groupId);

    this.server.to(groupRoom).emit('group_message', {
      fromUserId,
      groupId: payload.groupId,
      content: payload.content,
      sentAt: new Date().toISOString(),
    });

    return { delivered: true };
  }

  private getUserId(client: Socket): string | null {
    const userId = client.handshake.auth?.userId ?? client.handshake.query?.userId;
    if (Array.isArray(userId)) {
      return userId[0] ?? null;
    }
    return typeof userId === 'string' ? userId : null;
  }

  private groupRoom(groupId: string): string {
    return `group:${groupId}`;
  }
}
