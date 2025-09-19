import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';
import { WorkItem } from 'src/modules/work-items/entities/work-item.entity';

@Entity('work_item_comments')
export class Comment {
  @ApiProperty({ description: 'Comment ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Related work item ID' })
  @Column({ type: 'uuid' })
  workItemId: string;

  @ManyToOne(() => WorkItem, { onDelete: 'CASCADE' })
  workItem: WorkItem;

  @ApiProperty({ description: 'Comment author user ID' })
  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @ApiProperty({ description: 'Comment body' })
  @Column({ type: 'varchar', length: 1000 })
  body: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
