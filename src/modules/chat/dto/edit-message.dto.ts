import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({ description: 'New message body', maxLength: 2000 })
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
