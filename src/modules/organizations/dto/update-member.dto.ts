import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { OrganizationRole } from '../entities/organization-member.entity';

export class UpdateMemberDto {
  @ApiProperty({ enum: OrganizationRole, description: 'New membership role' })
  @Expose()
  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
