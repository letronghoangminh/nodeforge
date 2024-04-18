import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { AmplifyConfigurationModel } from 'src/amplify/model/amplify.model';
import { ECSConfigurationModel } from 'src/ecs/model/ecs.model';
import { PlainToInstance } from 'src/helpers/helpers';

export class RepositoryModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: Number })
  githubProfileId: number;

  @Expose()
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: String })
  branch: string;

  @Expose()
  @ApiProperty({ type: String })
  url: string;

  @Expose()
  @ApiProperty({ type: Date })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class DeploymentModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

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
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: Date })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: Date })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ type: RepositoryModel })
  @Transform(({ obj }) => PlainToInstance(RepositoryModel, obj.repository))
  repository: RepositoryModel;

  @Expose()
  @ApiProperty({ type: AmplifyConfigurationModel })
  @Transform(({ obj }) =>
    PlainToInstance(AmplifyConfigurationModel, obj.AmplifyConfiguration),
  )
  amplifyConfiguration: AmplifyConfigurationModel;

  @Expose()
  @ApiProperty({ type: ECSConfigurationModel })
  @Transform(({ obj }) =>
    PlainToInstance(ECSConfigurationModel, obj.ECSConfiguration),
  )
  ecsConfiguration: ECSConfigurationModel;
}

export class EnvironmentModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: Object, additionalProperties: { type: 'string' } })
  @Transform(({ obj }) => JSON.parse(JSON.stringify(obj.envVars)))
  envVars: Record<string, string>;
}