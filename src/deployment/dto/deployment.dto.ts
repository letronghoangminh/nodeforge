import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsString } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  @ApiProperty({ type: String })
  @IsIn(['BACKEND', 'FRONTEND'])
  type: string;

  @IsString()
  @ApiProperty({ type: String })
  framework: string;

  @IsString()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @ApiProperty({ type: String })
  repositoryName: string;

  @IsString()
  @ApiProperty({ type: String })
  repositoryBranch: string;

  @IsString()
  @ApiProperty({ type: String })
  repositoryUrl: string;

  @IsString()
  @ApiProperty({ type: String })
  repositoryOwner: string;

  @IsString()
  @ApiProperty({ type: String })
  subdomain: string;

  @ApiProperty({ type: Object, additionalProperties: { type: 'string' } })
  envVars: Record<string, string>;
}

export class CheckSubdomainDto {
  @IsString()
  @ApiProperty({ type: String })
  subdomain: string;
}

export class UpdateEnvironmentDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Object, additionalProperties: { type: 'string' } })
  envVars: Record<string, string>;
}
