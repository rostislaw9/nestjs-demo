import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @Expose()
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: 'Message text', maxLength: 2000 })
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
