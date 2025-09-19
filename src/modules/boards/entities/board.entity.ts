import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { User } from 'src/modules/users/entities/user.entity';

import { BoardMember } from './board-member.entity';

@Entity('boards')
export class Board {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 120 })
  title: string;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @ApiPropertyOptional()
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  organization?: Organization;

  @OneToMany(() => BoardMember, (m) => m.board, { cascade: true })
  members: BoardMember[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
