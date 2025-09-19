import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { ActivityType } from '../entities/activity.entity';

export class CreateActivityDto {
  @ApiProperty({ description: 'User ID who performed the action' })
  @Expose()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ActivityType, description: 'Type of activity' })
  @Expose()
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({ description: 'Related work item ID' })
  @Expose()
  @IsUUID()
  @IsOptional()
  workItemId?: string;

  @ApiProperty({ description: 'Activity description' })
  @Expose()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Organization ID (for org-scoped activity)',
  })
  @Expose()
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @Expose()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
