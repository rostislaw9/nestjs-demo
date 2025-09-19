import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from 'src/common/enums';
import { WorkItem } from 'src/modules/work-items/entities/work-item.entity';

export enum LocationPrivacy {
  HIDDEN = 'hidden',
  ORGANIZATIONS = 'organizations',
  PUBLIC = 'public',
}

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

  @ApiProperty({ description: 'Avatar image URL', required: false })
  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @ApiProperty({ description: 'Short profile bio', required: false })
  @Column({ type: 'varchar', nullable: true })
  bio?: string;

  @ApiProperty({ description: 'Job title or role', required: false })
  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @ApiProperty({ description: 'Company or organization', required: false })
  @Column({ type: 'varchar', nullable: true })
  company?: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @Column({ type: 'double precision', nullable: true })
  @Index()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @Column({ type: 'double precision', nullable: true })
  @Index()
  longitude?: number;

  @ApiProperty({ description: 'Location text representation', required: false })
  @Column({ type: 'varchar', nullable: true })
  locationText?: string;

  @ApiProperty({
    description: 'Location privacy setting',
    enum: LocationPrivacy,
    default: LocationPrivacy.HIDDEN,
  })
  @Column({
    type: 'enum',
    enum: LocationPrivacy,
    default: LocationPrivacy.HIDDEN,
  })
  locationPrivacy: LocationPrivacy;

  @ApiProperty({ description: 'Created at timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ApiProperty({
    description: 'User roles',
    isArray: true,
    enum: Role,
    default: [Role.DEFAULT],
  })
  @Column('text', { array: true, default: [Role.DEFAULT] })
  roles: Role[];

  @OneToMany(() => WorkItem, (workItem) => workItem.owner)
  workItems?: WorkItem[];
}
