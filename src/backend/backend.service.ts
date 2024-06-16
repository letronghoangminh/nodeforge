import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';
import { DeploymentStatus, Repository } from '@prisma/client';
import { EcsService } from 'src/aws-services/ecs.service';
import { AlbService } from 'src/aws-services/alb.service';
import { R53Service } from 'src/aws-services/r53.service';
import { SqsService } from 'src/aws-services/sqs.service';
import { DockerService } from 'src/docker/docker.service';
import { Ec2Service } from 'src/aws-services/ec2.service';
import { IamService } from 'src/aws-services/iam.service';
import { EventTypeEnum } from './enum/backend.enum';
import { GithubService } from 'src/github/github.service';
import { OpenaiService } from 'src/openai/openai.service';
import { CloudWatchLogService } from 'src/aws-services/cloudwatchlog.service';
import { CloudWatchService } from 'src/aws-services/cloudwatch.service';

@Injectable()
export class BackendService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private ecsService: EcsService,
    private albService: AlbService,
    private r53Service: R53Service,
    private sqsService: SqsService,
    private ec2Service: Ec2Service,
    private iamService: IamService,
    private cloudwatchService: CloudWatchService,
    private cloudwatchlogService: CloudWatchLogService,
    private dockerService: DockerService,
    private githubService: GithubService,
    private openaiService: OpenaiService,
  ) {}

  onModuleInit() {
    const enableConsumer = process.env.WORKER_ENABLE;
    if (enableConsumer)
      this.consumer(this.configService.get('aws.sqs.queueName'));
  }

  async consumer(queueName): Promise<void> {
    const consumer = Consumer.create({
      queueUrl: this.configService.get('aws.sqs.queueUrl'),
      handleMessage: async (message) => {
        await this.messageHandler({
          body: message.Body,
          queueName: queueName,
        });
      },
      sqs: this.sqsService.client,
    });

    console.log(`SQS - Started Consumer with queue ${queueName}`);
    consumer.start();
  }

  private async generateDockerfile(
    dto: CreateDeploymentDto,
    repository: Repository,
    userId: number,
  ): Promise<string> {
    const packageJson = await this.githubService.getFileContent(
      'package.json',
      repository.name,
      repository.owner,
      repository.branch,
      userId,
    );

    const dockerfile = await this.openaiService.generateDockerfile({
      framework: dto.framework,
      packageJson,
    });

    console.log(dockerfile);

    return dockerfile;
  }

  private async messageHandler(options: {
    body: any;
    queueName: string;
  }): Promise<void> {
    console.log(
      `SQS - Message Handler - body: ${options.body}, queueName:  ${options.queueName}`,
    );
    options.body = JSON.parse(options.body);
    const environmentId = options.body.environmentId as number;
    const deploymentId = options.body.deploymentId as number;
    const repository = options.body.repository as Repository;
    const accessToken = options.body.accessToken as string;
    const createDeploymentData = options.body
      .createDeploymentData as CreateDeploymentDto;
    const eventType = options.body.eventType as EventTypeEnum;
    const eventId = options.body.eventId as string;

    const event = await this.prismaService.event.findFirst({
      where: {
        eventId,
      },
    });

    if (event) return;

    await this.prismaService.event.create({
      data: {
        eventId,
      },
    });

    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: deploymentId,
      },
      include: {
        ECSConfiguration: {
          select: {
            id: true,
            environmentId: true,
          },
        },
      },
    });

    if (!deployment) return;

    try {
      if (eventType === EventTypeEnum.CREATE) {
        const dockerfile = await this.generateDockerfile(
          createDeploymentData,
          repository,
          deployment.userId,
        );

        const dockerImage = this.dockerService.buildDockerImage(
          createDeploymentData,
          repository,
          accessToken,
          dockerfile,
        );

        const {
          secgroupId,
          listenerRuleArn,
          targetGroupArn,
          taskRoleArn,
          taskExecutionRoleArn,
        } = await this.deployBackendService(
          createDeploymentData,
          environmentId,
          dockerImage,
        );

        await this.prismaService.eCSConfiguration.create({
          data: {
            deploymentId,
            subdomain: createDeploymentData.subdomain,
            environmentId,
            serviceName: createDeploymentData.name,
            cpu: '256',
            memory: '512',
            dockerImage,
            listenerRuleArn,
            targetGroupArn,
            secgroupId,
            taskRoleArn,
            taskExecutionRoleArn,
            command: createDeploymentData.command,
          },
        });

        await this.prismaService.deployment.update({
          where: {
            id: deploymentId,
          },
          data: {
            status: DeploymentStatus.SUCCESS,
          },
        });
      } else if (eventType === EventTypeEnum.DELETE) {
        const ecsConfiguration =
          await this.prismaService.eCSConfiguration.findFirst({
            where: {
              deploymentId,
            },
            select: {
              serviceName: true,
              targetGroupArn: true,
              listenerRuleArn: true,
              secgroupId: true,
              subdomain: true,
            },
          });

        await this.ecsService.deleteEcsService(ecsConfiguration?.serviceName);

        await this.iamService.deleteIamRolesForEcs(
          ecsConfiguration?.serviceName,
        );

        await this.albService.deleteTargetGroupForEcs(
          ecsConfiguration?.listenerRuleArn,
          ecsConfiguration?.targetGroupArn,
        );

        await this.r53Service.deleteRoute53RecordForECS(
          ecsConfiguration?.subdomain,
        );

        // await this.ec2Service.deleteSecurityGroupForECS(
        //   ecsConfiguration.secgroupId,
        // );

        await this.prismaService.eCSConfiguration.delete({
          where: {
            id: deployment.ECSConfiguration.id,
          },
        });

        await this.prismaService.environment.delete({
          where: {
            id: deployment.ECSConfiguration.environmentId,
          },
        });

        await this.prismaService.deployment.delete({
          where: {
            id: deploymentId,
          },
        });

        await this.prismaService.repository.delete({
          where: {
            id: deployment.repositoryId,
          },
        });
      }
    } catch (error) {
      console.log(error);

      await this.prismaService.deployment.update({
        where: {
          id: deploymentId,
        },
        data: {
          status: DeploymentStatus.FAILURE,
          reason: error.message,
        },
      });
    }
  }

  private async deployBackendService(
    dto: CreateDeploymentDto,
    environmentId: number,
    dockerImage: string,
  ): Promise<{
    secgroupId: string;
    targetGroupArn: string;
    listenerRuleArn: string;
    taskRoleArn: string;
    taskExecutionRoleArn: string;
  }> {
    const secgroupId = await this.ec2Service.createSecurityGroupForECS(dto);

    await this.r53Service.createRoute53RecordForECS(dto);

    const { targetGroupArn, listenerRuleArn } =
      await this.albService.createTargetGroupForEcs(dto);

    const { taskRoleArn, taskExecutionRoleArn } =
      await this.iamService.createIamRolesForEcs(dto);

    await this.ecsService.createEcsService(
      dto,
      dockerImage,
      environmentId,
      targetGroupArn,
      secgroupId,
      taskRoleArn,
      taskExecutionRoleArn,
    );

    return {
      secgroupId,
      targetGroupArn,
      listenerRuleArn,
      taskRoleArn,
      taskExecutionRoleArn,
    };
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
  ): Promise<void> {
    const sendSqsMessageInput = this.sqsService.buildSendSqsMessageInput(
      dto,
      repository,
      accessToken,
      deploymentId,
      environmentId,
      EventTypeEnum.CREATE,
    );
    await this.sqsService.sendSqsMessage(sendSqsMessageInput);
  }

  async deleteDeployment(deploymentId: number): Promise<void> {
    const sendSqsMessageInput = this.sqsService.buildSendSqsMessageInput(
      null,
      null,
      null,
      deploymentId,
      null,
      EventTypeEnum.DELETE,
    );

    await this.sqsService.sendSqsMessage(sendSqsMessageInput);
  }

  async getDeploymentLogs(serviceName: string) {
    const logEvents = await this.cloudwatchlogService.getLogsForECS(
      serviceName,
    );

    const events = [];

    logEvents.map((logEvent) => {
      const event = {
        message: logEvent.message,
        timestamp: new Date(+logEvent.timestamp.toString().slice(0, 10) * 1000)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' '),
      };

      events.push(event);
    });

    return events;
  }

  async getHealthMetrics(serviceName: string) {
    const healthMetrics = await this.cloudwatchService.getHealthMetricsForECS(
      serviceName,
    );

    return healthMetrics;
  }

  async updateEnvironment(ecsConfigId: number): Promise<void> {
    const ecsConfig = await this.prismaService.eCSConfiguration.findFirst({
      where: {
        id: ecsConfigId,
      },
    });

    await this.ecsService.updateEcsService(ecsConfig);
  }
}
