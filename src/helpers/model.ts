import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageModel {
  @Expose()
  @ApiProperty({ type: String })
  message: string;
}
