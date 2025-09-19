import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

import type { ActivitiesService } from 'src/modules/activities/activities.service';
import { ActivityType } from 'src/modules/activities/entities/activity.entity';
import {
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
} from 'src/modules/work-items/entities/work-item.entity';

import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('CommentsService', () => {
  const ownerId = '38c0bf56-4369-4c0e-a13e-914544cc9e21';
  const workItemId = 'a3f8ce7e-468a-4fef-bd66-6c2480124d41';
  const commentId = 'f750b798-618e-4480-9f2b-372af537a069';

  let service: CommentsService;
  let comments: MockRepository<Comment>;
  let workItems: MockRepository<WorkItem>;
  let orgMembers: { findOne: jest.Mock };
  let activitiesService: { create: jest.Mock };
  let gateway: { emit: jest.Mock; emitToOrg: jest.Mock };

  const workItem = {
    id: workItemId,
    ownerId,
    title: 'Ship the portfolio workspace',
    description: 'Add enough functionality to demonstrate full-stack depth.',
    status: WorkItemStatus.IN_PROGRESS,
    priority: WorkItemPriority.HIGH,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as WorkItem;

  beforeEach(() => {
    comments = {
      create: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    workItems = {
      findOne: jest.fn(),
    };
    orgMembers = { findOne: jest.fn() };
    activitiesService = { create: jest.fn() };
    gateway = { emit: jest.fn(), emitToOrg: jest.fn() };

    service = new CommentsService(
      comments as unknown as Repository<Comment>,
      workItems as unknown as Repository<WorkItem>,
      orgMembers as any,
      activitiesService as unknown as ActivitiesService,
      gateway as any,
    );
  });

  it('creates a comment for an owned work item and records activity', async () => {
    const draft = {
      workItemId,
      authorId: ownerId,
      body: 'This now has a collaborative review thread.',
    } as Comment;
    const saved = { ...draft, id: commentId } as Comment;
    const hydrated = {
      ...saved,
      author: { id: ownerId, email: 'owner@example.com' },
    } as Comment;

    workItems.findOne?.mockResolvedValue(workItem);
    comments.create?.mockReturnValue(draft);
    comments.save?.mockResolvedValue(saved);
    comments.findOneOrFail?.mockResolvedValue(hydrated);
    activitiesService.create.mockResolvedValue(undefined);

    await expect(
      service.create(ownerId, workItemId, { body: draft.body }),
    ).resolves.toBe(hydrated);

    expect(comments.create).toHaveBeenCalledWith({
      workItemId,
      authorId: ownerId,
      body: draft.body,
    });
    expect(activitiesService.create).toHaveBeenCalledWith({
      userId: ownerId,
      type: ActivityType.COMMENT_CREATED,
      workItemId,
      organizationId: undefined,
      description: `Commented on "${workItem.title}"`,
      metadata: { workItemTitle: workItem.title },
    });
  });

  it('blocks edits from users who did not author the comment', async () => {
    workItems.findOne?.mockResolvedValue(workItem);
    comments.findOne?.mockResolvedValue({
      id: commentId,
      workItemId,
      authorId: '0bd5191d-844b-4a1a-b2bf-9d9e63fde49d',
      body: 'Original comment',
    } as Comment);

    await expect(
      service.update(ownerId, workItemId, commentId, { body: 'Updated text' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(comments.save).not.toHaveBeenCalled();
  });

  it('does not expose comments for work items the user does not own', async () => {
    workItems.findOne?.mockResolvedValue(null);

    await expect(service.findAll(ownerId, workItemId)).rejects.toThrow(
      NotFoundException,
    );

    expect(comments.find).not.toHaveBeenCalled();
  });
});
