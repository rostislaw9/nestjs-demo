import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

import { OrganizationRole } from '../entities/organization-member.entity';

export class AddMemberDto {
  @ApiProperty({
    type: String,
    description: 'Existing user email',
    example: 'teammate@example.com',
  })
  @Expose()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: OrganizationRole,
    description: 'Membership role',
    default: OrganizationRole.MEMBER,
  })
  @Expose()
  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole;
}
