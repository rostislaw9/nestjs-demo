import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';

import { Board } from './board.entity';

export type ElementType = 'path' | 'rect' | 'ellipse' | 'text' | 'line';

@Entity('board_elements')
export class BoardElement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  board: Board;

  @ApiProperty()
  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @ApiProperty({
    description: 'Element type: path | rect | ellipse | text | line',
  })
  @Column({ type: 'varchar', length: 32 })
  type: ElementType;

  @ApiProperty({ description: 'JSON payload specific to element type' })
  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 16, default: '#000000' })
  color: string;

  @ApiPropertyOptional()
  @Column({ type: 'float', default: 2 })
  strokeWidth: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  zIndex: number;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
