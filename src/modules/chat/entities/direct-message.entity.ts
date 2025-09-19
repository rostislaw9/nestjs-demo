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

@Entity('direct_messages')
export class DirectMessage {
  @ApiProperty({ description: 'Message ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Sender user ID' })
  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  sender: User;

  @ApiProperty({ description: 'Recipient user ID' })
  @Column({ type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  recipient: User;

  @ApiProperty({ description: 'Message body' })
  @Column({ type: 'varchar', length: 2000 })
  body: string;

  @ApiProperty({ description: 'Whether recipient has read the message' })
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @ApiProperty({ description: 'Whether message was edited' })
  @Column({ type: 'boolean', default: false })
  edited: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
