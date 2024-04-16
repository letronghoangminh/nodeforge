import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AmplifyConfigurationModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: String })
  appId: string;

  @Expose()
  @ApiProperty({ type: String })
  webhookUrl: string;

  @Expose()
  @ApiProperty({ type: Number })
  environmentId: number;

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
