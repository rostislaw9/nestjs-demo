import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    type: String,
    description: 'Updated comment body',
    example: 'Updated after checking the backend contract.',
  })
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}
