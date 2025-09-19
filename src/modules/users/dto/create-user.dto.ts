import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'User email',
    example: 'user@example.com',
  })
  @Expose()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Firebase UID',
    example: '7gZPjFvRkT2LQyXn9w5dHcUa0oMbNsEi',
  })
  @Expose()
  @IsString()
  firebaseUID: string;

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
    type: String,
    description: 'User location',
    example: 'Bangkok, Thailand',
  })
  @Expose()
  @IsString()
  @MaxLength(80)
  @IsOptional()
  location?: string;
}
