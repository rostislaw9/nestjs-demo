import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrganizationMember } from './organization-member.entity';

@Entity('organizations')
export class Organization {
  @ApiProperty({ description: 'Organization ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Organization name' })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ApiPropertyOptional({ description: 'Short organization description' })
  @Column({ type: 'varchar', length: 240, nullable: true })
  description?: string;

  @ApiProperty({ description: 'Organization owner user ID' })
  @Column({ type: 'uuid' })
  ownerId: string;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members?: OrganizationMember[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
