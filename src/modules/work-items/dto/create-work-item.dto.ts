import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { WorkItemPriority, WorkItemStatus } from '../entities/work-item.entity';

export class CreateWorkItemDto {
  @ApiProperty({ type: String, maxLength: 120 })
  @Expose()
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ type: String, maxLength: 500 })
  @Expose()
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: WorkItemStatus })
  @Expose()
  @IsEnum(WorkItemStatus)
  @IsOptional()
  status?: WorkItemStatus;

  @ApiPropertyOptional({ enum: WorkItemPriority })
  @Expose()
  @IsEnum(WorkItemPriority)
  @IsOptional()
  priority?: WorkItemPriority;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @Expose()
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ description: 'Assignee user ID', nullable: true })
  @Expose()
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;
}
