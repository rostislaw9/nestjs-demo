import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    type: String,
    description: 'Comment body',
    example: 'I can take this one after the API review.',
  })
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}
