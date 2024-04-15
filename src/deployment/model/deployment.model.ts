import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeploymentModel {
  @Expose()
  @ApiProperty({ type: String })
  type: string;

  @Expose()
  @ApiProperty({ type: String })
  framework: string;

  @Expose()
  @ApiProperty({ type: Number })
  repositoryId: number;

  @Expose()
  @ApiProperty({ type: String })
  status: string;

  @Expose()
  @ApiProperty({ type: String })
  subdomain: string;

  @Expose()
  @ApiProperty({ type: Date })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: Date })
  updatedAt: Date;
}
