import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

import { ActivitiesService } from 'src/modules/activities/activities.service';
import { ActivityType } from 'src/modules/activities/entities/activity.entity';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { WorkItem } from 'src/modules/work-items/entities/work-item.entity';
import { WorkItemsGateway } from 'src/modules/work-items/work-items.gateway';

import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly comments: Repository<Comment>,
    @InjectRepository(WorkItem)
    private readonly workItems: Repository<WorkItem>,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
    private readonly activitiesService: ActivitiesService,
    private readonly gateway: WorkItemsGateway,
  ) {}

  async findAll(ownerId: string, workItemId: string): Promise<Comment[]> {
    await this.findOwnedWorkItem(ownerId, workItemId);

    return this.comments.find({
      where: { workItemId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    ownerId: string,
    workItemId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const workItem = await this.findOwnedWorkItem(ownerId, workItemId);
    const comment = this.comments.create({
      workItemId,
      authorId: ownerId,
      body: dto.body,
    });
    const saved = await this.comments.save(comment);

    await this.activitiesService.create({
      userId: ownerId,
      type: ActivityType.COMMENT_CREATED,
      workItemId,
      organizationId: workItem.organizationId,
      description: `Commented on "${workItem.title}"`,
      metadata: { workItemTitle: workItem.title },
    });

    const created = await this.comments.findOneOrFail({
      where: { id: saved.id },
      relations: ['author'],
    });
    if (workItem.organizationId) {
      this.gateway.emitToOrg(workItem.organizationId, 'comment:created', {
        ...created,
        workItemId,
      });
    } else {
      this.gateway.emit(ownerId, 'comment:created', { ...created, workItemId });
    }
    return created;
  }

  async update(
    ownerId: string,
    workItemId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    await this.findOwnedWorkItem(ownerId, workItemId);
    const comment = await this.findComment(workItemId, commentId);

    if (comment.authorId !== ownerId) {
      throw new UnauthorizedException('Only the author can edit this comment');
    }

    comment.body = dto.body;
    await this.comments.save(comment);

    const updated = await this.comments.findOneOrFail({
      where: { id: comment.id },
      relations: ['author'],
    });
    const workItemForUpdate = await this.workItems.findOne({
      where: { id: workItemId },
    });
    if (workItemForUpdate?.organizationId) {
      this.gateway.emitToOrg(
        workItemForUpdate.organizationId,
        'comment:updated',
        updated,
      );
    } else {
      this.gateway.emit(ownerId, 'comment:updated', updated);
    }
    return updated;
  }

  async delete(
    ownerId: string,
    workItemId: string,
    commentId: string,
  ): Promise<void> {
    const workItem = await this.findOwnedWorkItem(ownerId, workItemId);
    const comment = await this.findComment(workItemId, commentId);

    if (comment.authorId !== ownerId) {
      throw new UnauthorizedException(
        'Only the author can delete this comment',
      );
    }

    await this.comments.delete({ id: commentId, workItemId });
    if (workItem.organizationId) {
      this.gateway.emitToOrg(workItem.organizationId, 'comment:deleted', {
        id: commentId,
        workItemId,
      });
    } else {
      this.gateway.emit(ownerId, 'comment:deleted', {
        id: commentId,
        workItemId,
      });
    }
    await this.activitiesService.create({
      userId: ownerId,
      type: ActivityType.COMMENT_DELETED,
      workItemId,
      organizationId: workItem.organizationId,
      description: `Deleted a comment from "${workItem.title}"`,
      metadata: { workItemTitle: workItem.title },
    });
  }

  private async findOwnedWorkItem(requesterId: string, workItemId: string) {
    this.assertUuid(requesterId);
    this.assertUuid(workItemId);

    const workItem = await this.workItems.findOne({
      where: { id: workItemId },
    });

    if (!workItem) {
      throw new NotFoundException(`Work item ${workItemId} not found`);
    }

    if (workItem.organizationId) {
      const membership = await this.orgMembers.findOne({
        where: { userId: requesterId, organizationId: workItem.organizationId },
      });
      if (!membership) {
        throw new UnauthorizedException('Organization access denied');
      }
    } else if (workItem.ownerId !== requesterId) {
      throw new NotFoundException(`Work item ${workItemId} not found`);
    }

    return workItem;
  }

  private async findComment(workItemId: string, commentId: string) {
    this.assertUuid(commentId);

    const comment = await this.comments.findOne({
      where: { id: commentId, workItemId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    return comment;
  }

  private assertUuid(value: string) {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }
  }
}
