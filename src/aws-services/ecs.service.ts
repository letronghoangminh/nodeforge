import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  AssignPublicIp,
  Compatibility,
  CreateServiceCommand,
  CreateServiceCommandInput,
  CreateServiceCommandOutput,
  ECSClient,
  LaunchType,
  NetworkMode,
  RegisterTaskDefinitionCommand,
  RegisterTaskDefinitionCommandInput,
  RegisterTaskDefinitionCommandOutput,
  SchedulingStrategy,
  TransportProtocol,
} from '@aws-sdk/client-ecs';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
    dto: CreateDeploymentDto,
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
      family: `${dto.name}-task`,
      networkMode: NetworkMode.AWSVPC,
      requiresCompatibilities: [Compatibility.FARGATE],
      cpu: '256',
      memory: '512',
      taskRoleArn: taskRoleArn,
      executionRoleArn: taskExecutionRoleArn,
      containerDefinitions: [
        {
          name: `${dto.name}-container`,
          image: dockerImage,
          essential: true,
          portMappings: [
            {
              containerPort: 8000,
              hostPort: 8000,
              protocol: TransportProtocol.TCP,
            },
          ],
          environment: Object.entries(envVars).map(([name, value]) => {
            return { name, value };
          }),
        },
      ],
    };

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
          assignPublicIp: AssignPublicIp.DISABLED,
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
        dto,
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
}
