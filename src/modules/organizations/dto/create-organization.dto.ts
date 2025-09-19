import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    type: String,
    description: 'Organization name',
    example: 'Rocket Space',
  })
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Short description',
    example: 'Product and platform demo team.',
  })
  @Expose()
  @IsString()
  @MaxLength(240)
  @IsOptional()
  description?: string;
}
