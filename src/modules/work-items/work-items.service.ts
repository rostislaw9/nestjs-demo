import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { In, IsNull, Repository } from 'typeorm';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { ActivitiesService } from 'src/modules/activities/activities.service';
import { ActivityType } from 'src/modules/activities/entities/activity.entity';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';

import { UsersService } from '../users/users.service';
import {
  CreateWorkItemDto,
  ReorderWorkItemsDto,
  UpdateWorkItemDto,
} from './dto';
import { WorkItem, WorkItemStatus } from './entities/work-item.entity';
import { WorkItemsGateway } from './work-items.gateway';

@Injectable()
export class WorkItemsService {
  constructor(
    @InjectRepository(WorkItem)
    private readonly workItems: Repository<WorkItem>,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
    private readonly activitiesService: ActivitiesService,
    private readonly gateway: WorkItemsGateway,
    private readonly usersService: UsersService,
  ) {}

  async findAll(
    requesterId: string,
    organizationId?: string,
    page?: number,
    limit = 10,
    status?: string,
  ): Promise<PaginatedResponse<WorkItem>> {
    this.assertUuid(requesterId);

    const statusFilter = status
      ?.split(',')
      .map((s) => s.trim())
      .filter((s) => s);

    const pagination: any = {};
    if (page !== undefined) {
      pagination.skip = (page - 1) * limit;
      pagination.take = limit;
    }

    let where: any;
    if (organizationId) {
      this.assertUuid(organizationId);
      await this.assertOrgMember(requesterId, organizationId);
      where = { organizationId };
    } else {
      where = { ownerId: requesterId, organizationId: IsNull() };
    }

    if (statusFilter?.length) {
      where.status =
        statusFilter.length === 1 ? statusFilter[0] : In(statusFilter);
    }

    const [data, totalCount] = await this.workItems.findAndCount({
      where,
      relations: ['assignee'],
      order: { position: 'ASC', createdAt: 'DESC' },
      ...pagination,
    });

    const currentPage = page ?? 1;
    const totalPages = Math.ceil(totalCount / limit);

    return { data, totalCount, totalPages, currentPage, limit };
  }

  async getStats(
    requesterId: string,
    organizationId?: string,
  ): Promise<{
    total: number;
    done: number;
    open: number;
    highPriority: number;
    completion: number;
  }> {
    this.assertUuid(requesterId);

    let where: any;
    if (organizationId) {
      this.assertUuid(organizationId);
      await this.assertOrgMember(requesterId, organizationId);
      where = { organizationId };
    } else {
      where = { ownerId: requesterId, organizationId: IsNull() };
    }

    const items = await this.workItems.find({
      where,
      select: ['id', 'status', 'priority'],
    });

    const total = items.length;
    const done = items.filter((i) => i.status === WorkItemStatus.DONE).length;
    const open = total - done;
    const highPriority = items.filter(
      (i) => i.priority === 'high' && i.status !== WorkItemStatus.DONE,
    ).length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, open, highPriority, completion };
  }

  async reorder(
    requesterId: string,
    dto: ReorderWorkItemsDto,
    organizationId?: string,
  ): Promise<void> {
    this.assertUuid(requesterId);

    if (organizationId) {
      this.assertUuid(organizationId);
      await this.assertOrgMember(requesterId, organizationId);
      await this.updatePositions(requesterId, dto.items, organizationId);
      return;
    }

    await this.updatePositions(requesterId, dto.items);
  }

  async create(
    requesterId: string,
    dto: CreateWorkItemDto,
    organizationId?: string,
  ): Promise<WorkItem> {
    const user = await this.usersService.findOne(requesterId);

    this.assertUuid(requesterId);

    if (organizationId) {
      this.assertUuid(organizationId);
      await this.assertOrgMember(requesterId, organizationId);
    }

    await this.assertAssignableAssignee(
      dto.assigneeId,
      requesterId,
      organizationId,
    );

    const workItem = this.workItems.create({
      ownerId: requesterId,
      organizationId: organizationId ?? undefined,
      ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null)),
    });
    const saved = await this.workItems.save(workItem);

    await this.activitiesService.create({
      userId: requesterId,
      type: ActivityType.WORK_ITEM_CREATED,
      workItemId: saved.id,
      organizationId: organizationId ?? undefined,
      description: `${user?.displayName ?? user.email} created work item "${saved.title}"`,
      metadata: { title: saved.title, status: saved.status },
    });

    if (organizationId) {
      this.gateway.emitToOrg(organizationId, 'workItem:created', saved);
    } else {
      this.gateway.emit(requesterId, 'workItem:created', saved);
    }
    return saved;
  }

  async update(
    requesterId: string,
    id: string,
    dto: UpdateWorkItemDto,
    organizationId?: string,
  ): Promise<WorkItem> {
    const user = await this.usersService.findOne(requesterId);

    this.assertUuid(requesterId);
    this.assertUuid(id);

    const workItem = await this.findAccessibleWorkItem(
      requesterId,
      id,
      organizationId,
    );

    const oldStatus = workItem.status;
    const previousTitle = workItem.title;
    const targetOrganizationId = workItem.organizationId ?? organizationId;
    await this.assertAssignableAssignee(
      dto.assigneeId,
      requesterId,
      targetOrganizationId,
    );

    const updates: Partial<WorkItem> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate;
    if (dto.assigneeId !== undefined) updates.assigneeId = dto.assigneeId;

    await this.workItems.update(workItem.id, updates);

    const saved = await this.workItems.findOne({
      where: { id: workItem.id },
      relations: ['assignee'],
    });
    if (!saved)
      throw new NotFoundException(
        `Work item ${workItem.id} not found after update`,
      );

    const title = saved.title ?? previousTitle;

    const actOrgId = saved.organizationId ?? organizationId;
    if (dto.status && dto.status !== oldStatus) {
      const isDone = dto.status === WorkItemStatus.DONE;
      await this.activitiesService.create({
        userId: requesterId,
        type: ActivityType.WORK_ITEM_STATUS_CHANGED,
        workItemId: saved.id,
        organizationId: actOrgId,
        description: isDone
          ? `${user?.displayName ?? user.email} completed work item "${title}"`
          : `${user?.displayName ?? user.email} changed "${title}" status to ${dto.status}`,
        metadata: { title, oldStatus, newStatus: dto.status },
      });
    } else {
      await this.activitiesService.create({
        userId: requesterId,
        type: ActivityType.WORK_ITEM_UPDATED,
        workItemId: saved.id,
        organizationId: actOrgId,
        description: `${user?.displayName ?? user.email} updated work item "${title}"`,
        metadata: { title },
      });
    }

    const orgId = saved.organizationId ?? organizationId;
    if (orgId) {
      this.gateway.emitToOrg(orgId, 'workItem:updated', saved);
    } else {
      this.gateway.emit(requesterId, 'workItem:updated', saved);
    }
    return saved;
  }

  async delete(
    requesterId: string,
    id: string,
    organizationId?: string,
  ): Promise<void> {
    const user = await this.usersService.findOne(requesterId);

    this.assertUuid(requesterId);
    this.assertUuid(id);

    const workItem = await this.findAccessibleWorkItem(
      requesterId,
      id,
      organizationId,
    );

    await this.workItems.delete({ id });

    await this.activitiesService.create({
      userId: requesterId,
      type: ActivityType.WORK_ITEM_DELETED,
      organizationId: workItem.organizationId ?? organizationId,
      description: `${user?.displayName ?? user.email} deleted work item "${workItem.title}"`,
      metadata: { title: workItem.title },
    });

    const orgId = workItem.organizationId ?? organizationId;
    if (orgId) {
      this.gateway.emitToOrg(orgId, 'workItem:deleted', { id });
    } else {
      this.gateway.emit(requesterId, 'workItem:deleted', { id });
    }
  }

  private async findAccessibleWorkItem(
    requesterId: string,
    id: string,
    organizationId?: string,
  ): Promise<WorkItem> {
    if (organizationId) {
      await this.assertOrgMember(requesterId, organizationId);
      const item = await this.workItems.findOne({
        where: { id, organizationId },
        relations: ['assignee'],
      });
      if (!item) throw new NotFoundException(`Work item ${id} not found`);
      return item;
    }

    const item = await this.workItems.findOne({
      where: { id, ownerId: requesterId },
      relations: ['assignee'],
    });
    if (!item) throw new NotFoundException(`Work item ${id} not found`);
    return item;
  }

  private async assertOrgMember(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.orgMembers.findOne({
      where: { userId, organizationId },
    });
    if (!membership) {
      throw new UnauthorizedException('Organization access denied');
    }
  }

  private async assertAssignableAssignee(
    assigneeId: string | null | undefined,
    requesterId: string,
    organizationId?: string,
  ): Promise<void> {
    if (!assigneeId) return;

    this.assertUuid(assigneeId);

    if (!organizationId) {
      if (assigneeId !== requesterId) {
        throw new UnauthorizedException(
          'Assignees outside organizations must be the requester',
        );
      }
      return;
    }

    const membership = await this.orgMembers.findOne({
      where: { userId: assigneeId, organizationId },
    });
    if (!membership) {
      throw new UnauthorizedException(
        'Assignee must be a member of the organization',
      );
    }
  }

  private async updatePositions(
    requesterId: string,
    items: ReorderWorkItemsDto['items'],
    organizationId?: string,
  ): Promise<void> {
    const params: Array<string | number> = [];
    const caseStatements: string[] = [];
    const idPlaceholders: string[] = [];

    for (const { id, position } of items) {
      this.assertUuid(id);
      params.push(id);
      const idParam = params.length;
      params.push(position);
      const positionParam = params.length;

      caseStatements.push(`WHEN $${idParam}::uuid THEN $${positionParam}::int`);
      idPlaceholders.push(`$${idParam}::uuid`);
    }

    if (!caseStatements.length) return;

    let scopeClause: string;
    if (organizationId) {
      params.push(organizationId);
      scopeClause = `"organizationId" = $${params.length}::uuid`;
    } else {
      params.push(requesterId);
      scopeClause = `"ownerId" = $${params.length}::uuid AND "organizationId" IS NULL`;
    }

    await this.workItems.query(
      `
        UPDATE "work_items"
        SET "position" = CASE "id"
          ${caseStatements.join('\n')}
          ELSE "position"
        END
        WHERE "id" IN (${idPlaceholders.join(', ')})
          AND ${scopeClause}
      `,
      params,
    );
  }

  private assertUuid(value: string) {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }
  }
}
