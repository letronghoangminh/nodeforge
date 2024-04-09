import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class SaveGithubProfileDto {
  @IsInt()
  @ApiProperty({ type: Number })
  installationId: number;
}

export class GetGithubBranchesDto {
  @IsString()
  @ApiProperty({ type: String })
  repository: string;

  @IsString()
  @ApiProperty({ type: String })
  owner: string;
}
