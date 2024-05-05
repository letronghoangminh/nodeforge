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
    private dockerService: DockerService,
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

  private async messageHandler(options: {
    body: any;
    queueName: string;
  }): Promise<void> {
    try {
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

      if (eventType === EventTypeEnum.CREATE) {
        const dockerImage = await this.dockerService.buildDockerImage(
          createDeploymentData,
          repository,
          accessToken,
        );

        const { secgroupId, listenerRuleArn, targetGroupArn } =
          await this.deployBackendService(
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

        await this.ecsService.deleteEcsService(ecsConfiguration.serviceName);

        await this.iamService.deleteIamRolesForEcs(
          ecsConfiguration.serviceName,
        );

        await this.albService.deleteTargetGroupForEcs(
          ecsConfiguration.listenerRuleArn,
          ecsConfiguration.targetGroupArn,
        );

        await this.r53Service.deleteRoute53RecordForECS(
          ecsConfiguration.subdomain,
        );

        await this.ec2Service.deleteSecurityGroupForECS(
          ecsConfiguration.secgroupId,
        );
      }
    } catch (error) {
      console.log(error);
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

    return { secgroupId, targetGroupArn, listenerRuleArn };
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

    await this.prismaService.eCSConfiguration.delete({
      where: {
        deploymentId,
      },
    });
  }
}
