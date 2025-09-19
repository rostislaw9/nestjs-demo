import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { WorkItemPriority, WorkItemStatus } from '../entities/work-item.entity';

export class UpdateWorkItemDto {
  @ApiPropertyOptional({ type: String, maxLength: 120 })
  @Expose()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  title?: string;

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
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o) => o.dueDate !== null)
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o) => o.assigneeId !== null)
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;
}
