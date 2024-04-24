import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';
import { Repository } from '@prisma/client';
import { EcsService } from 'src/aws-services/ecs.service';
import { AlbService } from 'src/aws-services/alb.service';
import { R53Service } from 'src/aws-services/r53.service';
import { SqsService } from 'src/aws-services/sqs.service';
import { DockerService } from 'src/docker/docker.service';

@Injectable()
export class BackendService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private ecsService: EcsService,
    private albService: AlbService,
    private r53Service: R53Service,
    private sqsService: SqsService,
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
        console.log(
          `SQS - Received message from ${queueName} - Message: ${message.Body}`,
        );
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

    // WORKER:
    //  - Build docker image
    //  - Create ECS Service, task definition
    //  - Create R53 record, target group, ALB listern rule
    //  - Update deployment record

    const dockerImage = await this.dockerService.buildDockerImage(
      createDeploymentData,
      repository,
      accessToken,
    );

    await this.deployBackendService(
      createDeploymentData,
      environmentId,
      dockerImage,
    );
  }

  private async deployBackendService(
    createDeploymentData: CreateDeploymentDto,
    environmentId: number,
    dockerImage: string,
  ): Promise<void> {
    const registerTaskDefinitionInput =
      await this.ecsService.buildRegisterTaskDefinitionInput(
        createDeploymentData,
        dockerImage,
        environmentId,
      );
    // const taskDefReseponse = await this.ecsService.registerTaskDefinition(
    //   registerTaskDefinitionInput,
    // );
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
    );
    await this.sqsService.sendSqsMessage(sendSqsMessageInput);

    // await this.prismaService.eCSConfiguration.create({
    //   data: {
    //     deploymentId,
    //     subdomain: dto.subdomain,
    //     environmentId: environmentId,
    //     serviceName: dto.name,
    //     dockerRepository: 'psycholog1st/nestjs-example',
    //     cpu: '10',
    //     memory: '256',
    //   },
    // });
  }
}
