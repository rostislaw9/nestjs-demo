import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { ElementType } from '../entities/board-element.entity';

export class UpsertElementDto {
  @ApiPropertyOptional({ description: 'Omit on create; provide on update' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsIn(['path', 'rect', 'ellipse', 'text', 'line'])
  type: ElementType;

  @ApiProperty()
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  strokeWidth?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  zIndex?: number;
}
