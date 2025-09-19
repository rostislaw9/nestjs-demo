import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

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
}
