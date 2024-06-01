import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  AssignPublicIp,
  Compatibility,
  CreateServiceCommand,
  CreateServiceCommandInput,
  CreateServiceCommandOutput,
  DeleteServiceCommand,
  DeleteServiceCommandInput,
  DeleteServiceCommandOutput,
  DeleteTaskDefinitionsCommand,
  DeleteTaskDefinitionsCommandInput,
  DeleteTaskDefinitionsCommandOutput,
  ECSClient,
  LaunchType,
  LogDriver,
  NetworkMode,
  RegisterTaskDefinitionCommand,
  RegisterTaskDefinitionCommandInput,
  RegisterTaskDefinitionCommandOutput,
  SchedulingStrategy,
  TransportProtocol,
  UpdateServiceCommand,
  UpdateServiceCommandInput,
  UpdateServiceCommandOutput,
} from '@aws-sdk/client-ecs';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ECSConfiguration } from '@prisma/client';

@Injectable()
export class EcsService extends AwsService {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super();
    this.client = new ECSClient({
      region: configService.get('aws.region'),
    });
  }

  private async buildRegisterTaskDefinitionInput(
    name: string,
    command: string,
    dockerImage: string,
    environmentId: number,
    taskRoleArn: string,
    taskExecutionRoleArn: string,
  ): Promise<RegisterTaskDefinitionCommandInput> {
    const environment = await this.prismaService.environment.findFirst({
      where: {
        id: environmentId,
      },
      select: {
        envVars: true,
      },
    });

    const envVars: Record<string, string> = JSON.parse(
      JSON.stringify(environment.envVars),
    );

    const input = {
      family: `${name}-task`,
      networkMode: NetworkMode.AWSVPC,
      requiresCompatibilities: [Compatibility.FARGATE],
      cpu: '256',
      memory: '512',
      taskRoleArn: taskRoleArn,
      executionRoleArn: taskExecutionRoleArn,
      containerDefinitions: [
        {
          name: `${name}-container`,
          image: dockerImage,
          essential: true,
          portMappings: [
            {
              containerPort: 8000,
              hostPort: 8000,
              protocol: TransportProtocol.TCP,
            },
          ],
          environment: Object.entries(envVars)
            .map(([name, value]) => {
              return { name, value };
            })
            .concat([{ name: 'PORT', value: '8000' }]),
          logConfiguration: {
            logDriver: LogDriver.AWSLOGS,
            options: {
              'awslogs-group': this.configService.get(
                'aws.ecs.cloudwatchLogGroup',
              ),
              'awslogs-region': this.configService.get('aws.region'),
              'awslogs-stream-prefix': `${name}`,
            },
          },
        },
      ],
    };

    if (command) {
      input.containerDefinitions[0]['command'] = ['sh', '-c', command];
    }

    return input;
  }

  private async registerTaskDefinition(
    input: RegisterTaskDefinitionCommandInput,
  ): Promise<RegisterTaskDefinitionCommandOutput> {
    return this.sendAwsCommand<
      RegisterTaskDefinitionCommandInput,
      RegisterTaskDefinitionCommandOutput
    >(RegisterTaskDefinitionCommand, input);
  }

  private buildCreateServiceInput(
    dto: CreateDeploymentDto,
    taskDefinitionArn: string,
    targetGroupArn: string,
    secgroupId: string,
  ): CreateServiceCommandInput {
    const input = {
      cluster: this.configService.get('aws.ecs.clusterName'),
      serviceName: dto.name,
      desiredCount: 1,
      taskDefinition: taskDefinitionArn,
      loadBalancers: [
        {
          targetGroupArn: targetGroupArn,
          containerName: `${dto.name}-container`,
          containerPort: 8000,
        },
      ],
      launchType: LaunchType.FARGATE,
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
      },
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: AssignPublicIp.ENABLED,
          subnets: (
            this.configService.get('aws.vpc.subnetIds') as string
          ).split(','),
          securityGroups: [secgroupId],
        },
      },
      healthCheckGracePeriodSeconds: 60,
      schedulingStrategy: SchedulingStrategy.REPLICA,
      enableExecuteCommand: true,
    };

    return input;
  }

  private async createService(
    input: CreateServiceCommandInput,
  ): Promise<CreateServiceCommandOutput> {
    return this.sendAwsCommand<
      CreateServiceCommandInput,
      CreateServiceCommandOutput
    >(CreateServiceCommand, input);
  }

  private buildUpdateServiceInput(
    taskDefinitionArn: string,
    serviceName: string,
  ): UpdateServiceCommandInput {
    const input = {
      taskDefinition: taskDefinitionArn,
      cluster: this.configService.get('aws.ecs.clusterName'),
      service: serviceName,
    };

    return input;
  }

  private async updateService(
    input: UpdateServiceCommandInput,
  ): Promise<UpdateServiceCommandOutput> {
    return this.sendAwsCommand<
      UpdateServiceCommandInput,
      UpdateServiceCommandOutput
    >(UpdateServiceCommand, input);
  }

  private buildDeleteServiceInput(
    serviceName: string,
  ): DeleteServiceCommandInput {
    const input = {
      cluster: this.configService.get('aws.ecs.clusterName'),
      service: serviceName,
      force: true,
    };

    return input;
  }

  private async deleteService(
    input: DeleteServiceCommandInput,
  ): Promise<DeleteServiceCommandOutput> {
    return this.sendAwsCommand<
      DeleteServiceCommandInput,
      DeleteServiceCommandOutput
    >(DeleteServiceCommand, input);
  }

  private buildDeleteTaskDefinitionsInput(
    taskDefName: string,
  ): DeleteTaskDefinitionsCommandInput {
    const input = {
      taskDefinitions: [taskDefName],
    };

    return input;
  }

  private async deleteTaskDefinitions(
    input: DeleteTaskDefinitionsCommandInput,
  ): Promise<DeleteTaskDefinitionsCommandOutput> {
    return this.sendAwsCommand<
      DeleteTaskDefinitionsCommandInput,
      DeleteTaskDefinitionsCommandOutput
    >(DeleteTaskDefinitionsCommand, input);
  }

  async createEcsService(
    dto: CreateDeploymentDto,
    dockerImage: string,
    environmentId: number,
    targetGroupArn: string,
    secgroupId: string,
    taskRoleArn: string,
    taskExecutionRoleArn: string,
  ) {
    const registerTaskDefinitionInput =
      await this.buildRegisterTaskDefinitionInput(
        dto.name,
        dto.command,
        dockerImage,
        environmentId,
        taskRoleArn,
        taskExecutionRoleArn,
      );

    const taskDefResponse = await this.registerTaskDefinition(
      registerTaskDefinitionInput,
    );

    const createServiceInput = this.buildCreateServiceInput(
      dto,
      taskDefResponse.taskDefinition.taskDefinitionArn,
      targetGroupArn,
      secgroupId,
    );

    await this.createService(createServiceInput);
  }

  async deleteEcsService(serviceName: string) {
    try {
      const deleteServiceInput = this.buildDeleteServiceInput(serviceName);

      await this.deleteService(deleteServiceInput);

      const deleteTaskDefinitionsInput = this.buildDeleteTaskDefinitionsInput(
        `${serviceName}-task`,
      );

      await this.deleteTaskDefinitions(deleteTaskDefinitionsInput);
    } catch (error) {
      console.log(error);
    }
  }

  async updateEcsService(ecsConfig: ECSConfiguration) {
    const registerTaskDefinitionInput =
      await this.buildRegisterTaskDefinitionInput(
        ecsConfig.serviceName,
        ecsConfig.command,
        ecsConfig.dockerImage,
        ecsConfig.environmentId,
        ecsConfig.taskRoleArn,
        ecsConfig.taskExecutionRoleArn,
      );

    const taskDefResponse = await this.registerTaskDefinition(
      registerTaskDefinitionInput,
    );

    const updateServiceInput = this.buildUpdateServiceInput(
      taskDefResponse.taskDefinition.taskDefinitionArn,
      ecsConfig.serviceName,
    );

    await this.updateService(updateServiceInput);
  }
}
