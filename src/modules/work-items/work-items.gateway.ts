import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { isDev } from 'src/common/utils';
import { AuthService } from 'src/modules/auth/auth.service';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { UsersService } from 'src/modules/users/users.service';

export type WorkspaceEvent =
  | 'workItem:created'
  | 'workItem:updated'
  | 'workItem:deleted'
  | 'workItem:reordered'
  | 'comment:created'
  | 'comment:updated'
  | 'comment:deleted';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/workspace',
})
export class WorkItemsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserId(client);
    if (userId) {
      client.data.userId = userId;
      client.join(`user:${userId}`);
    }

    const orgIds = await this.resolveOrgIds(client, userId);
    for (const orgId of orgIds) {
      client.join(`org:${orgId}`);
    }
  }

  handleDisconnect() {}

  emit(userId: string, event: WorkspaceEvent, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToOrg(organizationId: string, event: WorkspaceEvent, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit(event, payload);
  }

  joinOrgRoom(userId: string, organizationId: string) {
    this.server.in(`user:${userId}`).socketsJoin(`org:${organizationId}`);
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

  private async resolveOrgIds(
    client: Socket,
    userId: string | undefined,
  ): Promise<string[]> {
    if (isDev()) {
      const orgIds = client.handshake.auth?.orgIds as string[] | undefined;
      return Array.isArray(orgIds) ? orgIds : [];
    }

    if (!userId) return [];

    const memberships = await this.orgMembers.find({
      where: { userId },
      select: ['organizationId'],
    });

    return memberships.map((membership) => membership.organizationId);
  }
}
