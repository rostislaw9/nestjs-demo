import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';

import { Organization } from './organization.entity';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('organization_members')
@Unique('UQ_organization_members_org_user', ['organizationId', 'userId'])
export class OrganizationMember {
  @ApiProperty({ description: 'Membership ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.members, {
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ enum: OrganizationRole })
  @Column({ type: 'varchar', length: 16, default: OrganizationRole.MEMBER })
  role: OrganizationRole;

  @ApiProperty({ description: 'Membership creation timestamp' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
