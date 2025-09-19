import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { User } from 'src/modules/users/entities/user.entity';

export enum WorkItemStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum WorkItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('work_items')
export class WorkItem {
  @ApiProperty({ description: 'Work item ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Owner user ID' })
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @ApiPropertyOptional({ description: 'Organization ID (shared workspace)' })
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
  organization?: Organization;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  assignee?: User;

  @ApiProperty({ description: 'Short title' })
  @Column({ type: 'varchar', length: 120 })
  title: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @ApiProperty({ enum: WorkItemStatus })
  @Column({ type: 'varchar', length: 32, default: WorkItemStatus.TODO })
  status: WorkItemStatus;

  @ApiProperty({ enum: WorkItemPriority })
  @Column({ type: 'varchar', length: 16, default: WorkItemPriority.MEDIUM })
  priority: WorkItemPriority;

  @ApiProperty({ description: 'Display order within status column' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiPropertyOptional({ description: 'Due date in ISO format' })
  @Column({ type: 'date', nullable: true })
  dueDate?: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
