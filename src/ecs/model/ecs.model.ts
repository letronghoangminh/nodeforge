import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ECSConfigurationModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: String })
  serviceName: string;

  @Expose()
  @ApiProperty({ type: String })
  cpu: string;

  @Expose()
  @ApiProperty({ type: String })
  memory: string;

  @Expose()
  @ApiProperty({ type: Number })
  environmentId: number;

  @Expose()
  @ApiProperty({ type: String })
  dockerRepository: string;

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
