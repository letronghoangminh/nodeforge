import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { AmplifyConfigurationModel } from 'src/frontend/model/frontend.model';
import { ECSConfigurationModel } from 'src/backend/model/backend.model';
import { PlainToInstance } from 'src/helpers/helpers';
import { UserModel } from 'src/user/model/user.model';

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
  @ApiProperty({ type: String })
  reason: string;

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

export class LogModel {
  @Expose()
  @ApiProperty({ type: String })
  timestamp: string;

  @Expose()
  @ApiProperty({ type: String })
  message: string;
}

export class HealthMetricsModel {
  @Expose()
  @ApiProperty({ type: String })
  cpu: string;

  @Expose()
  @ApiProperty({ type: String })
  memory: string;
}

export class DeploymentByUserModel {
  @Expose()
  @ApiProperty({ type: UserModel })
  @Transform(({ obj }) => PlainToInstance(UserModel, obj))
  user: UserModel;

  @Expose()
  @ApiProperty({ type: [DeploymentModel] })
  @Transform(({ obj }) => PlainToInstance(DeploymentModel, obj.Deployment))
  deployments: DeploymentModel[];
}
