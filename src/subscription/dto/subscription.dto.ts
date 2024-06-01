import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsNumber()
  @ApiProperty({ type: Number, required: true, nullable: false })
  subscriptionId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: true, nullable: false })
  subscriptionType: string;
}
