import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { Role } from 'src/common/enums';

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
