import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  @Matches(/^[a-zA-Z0-9_ ]{6,20}$/)
  name: string;

  @IsOptional()
  @ApiProperty({ type: String })
  @IsPhoneNumber()
  phoneNumber: string;
}
