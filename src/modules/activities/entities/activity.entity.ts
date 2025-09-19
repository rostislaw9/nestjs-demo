import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { User } from 'src/modules/users/entities/user.entity';

export enum ActivityType {
  COMMENT_CREATED = 'comment_created',
  COMMENT_DELETED = 'comment_deleted',
  ORGANIZATION_CREATED = 'organization_created',
  ORGANIZATION_UPDATED = 'organization_updated',
  ORGANIZATION_DELETED = 'organization_deleted',
  ORGANIZATION_MEMBER_ADDED = 'organization_member_added',
  WORK_ITEM_CREATED = 'work_item_created',
  WORK_ITEM_UPDATED = 'work_item_updated',
  WORK_ITEM_DELETED = 'work_item_deleted',
  WORK_ITEM_STATUS_CHANGED = 'work_item_status_changed',
  PROFILE_UPDATED = 'profile_updated',
  USER_LOGIN = 'user_login',
}

@Entity('activities')
export class Activity {
  @ApiProperty({ description: 'Activity ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiPropertyOptional({
    description: 'Organization ID (for org-scoped activity)',
  })
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
  organization?: Organization;

  @ApiProperty({ enum: ActivityType, description: 'Type of activity' })
  @Column({ type: 'varchar', length: 32 })
  type: ActivityType;

  @ApiPropertyOptional({ description: 'Related work item ID' })
  @Column({ type: 'uuid', nullable: true })
  workItemId?: string;

  @ApiProperty({ description: 'Activity description' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
