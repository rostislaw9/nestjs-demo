import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Role } from 'src/common/enums';
import { LocationPrivacy } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Display name',
    example: 'John Doe',
  })
  @Expose()
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Avatar image data URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @Expose()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Short profile bio',
    example: 'Building polished full-stack demos.',
  })
  @Expose()
  @IsString()
  @MaxLength(180)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Job title or role',
    example: 'Frontend Engineer',
  })
  @Expose()
  @IsString()
  @MaxLength(80)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Company or organization',
    example: 'Demo Labs',
  })
  @Expose()
  @IsString()
  @MaxLength(80)
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Latitude coordinate',
    example: 13.7563,
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Longitude coordinate',
    example: 100.5018,
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Location text representation',
    example: 'Bangkok, Thailand',
  })
  @Expose()
  @IsString()
  @IsOptional()
  locationText?: string;

  @ApiPropertyOptional({
    enum: LocationPrivacy,
    description: 'Location privacy setting',
    example: LocationPrivacy.HIDDEN,
  })
  @Expose()
  @IsEnum(LocationPrivacy)
  @IsOptional()
  locationPrivacy?: LocationPrivacy;

  @ApiPropertyOptional({
    type: [String],
    enum: Role,
    isArray: true,
    description: 'User roles',
  })
  @Expose()
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsOptional()
  roles?: Role[];
}
