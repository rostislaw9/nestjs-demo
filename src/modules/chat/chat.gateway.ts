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

import { isDev } from 'src/common/utils';
import { AuthService } from 'src/modules/auth/auth.service';
import { UsersService } from 'src/modules/users/users.service';

import { ChatService } from './chat.service';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DirectMessage } from './entities/direct-message.entity';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Set<string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserId(client);
    if (userId) {
      client.data.userId = userId;
      client.join(`chat:${userId}`);

      const wasOffline = !this.onlineUsers.has(userId);
      this.onlineUsers.add(userId);

      if (wasOffline) {
        this.server.emit('user:online', { userId });
      }

      client.emit('users:online', { userIds: Array.from(this.onlineUsers) });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user:offline', { userId });
    }
  }

  @SubscribeMessage('dm:send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const senderId = client.data.userId as string | undefined;
    if (!senderId) return;

    const message = await this.chatService.send(senderId, dto);

    this.server.to(`chat:${dto.recipientId}`).emit('dm:message', message);
    this.server.to(`chat:${senderId}`).emit('dm:message', message);

    return message;
  }

  @SubscribeMessage('dm:edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; body: string; peerId: string },
  ) {
    const senderId = client.data.userId as string | undefined;
    if (!senderId) return;

    const message = await this.chatService.editMessage(
      senderId,
      payload.messageId,
      {
        body: payload.body,
      } as EditMessageDto,
    );

    this.server.to(`chat:${payload.peerId}`).emit('dm:edited', message);
    this.server.to(`chat:${senderId}`).emit('dm:edited', message);

    return message;
  }

  @SubscribeMessage('dm:delete')
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; peerId: string },
  ) {
    const senderId = client.data.userId as string | undefined;
    if (!senderId) return;

    await this.chatService.deleteMessage(senderId, payload.messageId);

    const event = { messageId: payload.messageId };
    this.server.to(`chat:${payload.peerId}`).emit('dm:deleted', event);
    this.server.to(`chat:${senderId}`).emit('dm:deleted', event);
  }

  emitRead(userId: string, peerId: string) {
    this.server.to(`chat:${peerId}`).emit('dm:read', { readBy: userId });
  }

  emitMessage(message: DirectMessage) {
    this.server.to(`chat:${message.recipientId}`).emit('dm:message', message);
    this.server.to(`chat:${message.senderId}`).emit('dm:message', message);
  }

  emitEdited(message: DirectMessage, peerId: string) {
    this.server.to(`chat:${peerId}`).emit('dm:edited', message);
    this.server.to(`chat:${message.senderId}`).emit('dm:edited', message);
  }

  emitDeleted(messageId: string, senderId: string, peerId: string) {
    const event = { messageId };
    this.server.to(`chat:${peerId}`).emit('dm:deleted', event);
    this.server.to(`chat:${senderId}`).emit('dm:deleted', event);
  }

  emitConversationDeleted(userId: string, peerId: string) {
    this.server
      .to(`chat:${peerId}`)
      .emit('dm:conversation-deleted', { deletedBy: userId, peerId: userId });
    this.server
      .to(`chat:${userId}`)
      .emit('dm:conversation-deleted', { deletedBy: userId, peerId });
  }

  private async resolveUserId(client: Socket): Promise<string | undefined> {
    const requestedUserId = client.handshake.auth?.userId as string | undefined;
    if (isDev()) return requestedUserId;

    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return undefined;
    }

    try {
      const decoded = await this.authService.verifyToken(token);
      if (!decoded.email) {
        client.disconnect(true);
        return undefined;
      }

      const user = await this.usersService.findByEmail(decoded.email);
      if (!user || (requestedUserId && requestedUserId !== user.id)) {
        client.disconnect(true);
        return undefined;
      }

      return user.id;
    } catch {
      client.disconnect(true);
      return undefined;
    }
  }
}
