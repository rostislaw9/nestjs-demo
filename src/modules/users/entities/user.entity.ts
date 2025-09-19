import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from 'src/common/enums';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @ApiProperty({ description: 'Firebase UID' })
  @Column({ type: 'varchar', unique: true })
  firebaseUID: string;

  @ApiProperty({ description: 'Display name' })
  @Column({ type: 'varchar', nullable: true })
  displayName: string;

  @ApiProperty({ description: 'Created at timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'User roles',
    isArray: true,
    enum: Role,
    default: [Role.DEFAULT],
  })
  @Column('text', { array: true, default: [Role.DEFAULT] })
  roles: Role[];
}
