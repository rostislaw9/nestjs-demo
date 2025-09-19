import { InjectRepository } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';

import { isDev } from 'src/common/utils';
import { AuthService } from 'src/modules/auth/auth.service';
import { UsersService } from 'src/modules/users/users.service';

import { BoardsService } from './boards.service';
import { UpsertElementDto } from './dto/upsert-element.dto';
import { BoardMember } from './entities/board-member.entity';

export type BoardEvent =
  | 'board:element_upserted'
  | 'board:element_deleted'
  | 'board:cleared'
  | 'board:member_added'
  | 'board:member_removed'
  | 'board:cursor';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/boards',
})
export class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly boardsService: BoardsService,
    @InjectRepository(BoardMember)
    private readonly boardMembers: Repository<BoardMember>,
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserId(client);
    if (!userId) return;

    client.data.userId = userId;
    client.join(`user:${userId}`);

    const memberships = await this.boardMembers.find({
      where: { userId },
      select: ['boardId'],
    });
    for (const m of memberships) {
      client.join(`board:${m.boardId}`);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('board:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    try {
      await this.boardsService.findOneOrFail(payload.boardId, userId);
      client.join(`board:${payload.boardId}`);
    } catch {}
  }

  @SubscribeMessage('board:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    client.leave(`board:${payload.boardId}`);
  }

  @SubscribeMessage('board:draw')
  async handleDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; element: UpsertElementDto },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const element = await this.boardsService.upsertElement(
      payload.boardId,
      userId,
      payload.element,
    );

    client
      .to(`board:${payload.boardId}`)
      .emit('board:element_upserted', element);

    return element;
  }

  @SubscribeMessage('board:cursor')
  handleCursor(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; x: number; y: number },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    client.to(`board:${payload.boardId}`).emit('board:cursor', {
      userId,
      x: payload.x,
      y: payload.y,
    });
  }

  @SubscribeMessage('board:delete_element')
  async handleDeleteElement(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; elementId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    await this.boardsService.deleteElement(
      payload.boardId,
      payload.elementId,
      userId,
    );

    client
      .to(`board:${payload.boardId}`)
      .emit('board:element_deleted', { elementId: payload.elementId });
  }

  @SubscribeMessage('board:clear')
  async handleClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    await this.boardsService.clearBoard(payload.boardId, userId);
    client.to(`board:${payload.boardId}`).emit('board:cleared', {});
  }

  emit(boardId: string, event: BoardEvent, payload: unknown) {
    this.server.to(`board:${boardId}`).emit(event, payload);
  }

  joinBoardRoom(userId: string, boardId: string) {
    this.server.in(`user:${userId}`).socketsJoin(`board:${boardId}`);
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
