import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';

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

export class VerifyDto {
  @IsString()
  @IsEmail()
  @ApiProperty({ type: String, required: true, nullable: false })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: true, nullable: false })
  username: string;
}
