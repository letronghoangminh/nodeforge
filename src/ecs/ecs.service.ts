import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';
import { Repository } from '@prisma/client';

@Injectable()
export class EcsService {
  private sqsClient: SQSClient;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.sqsClient = new SQSClient({ region: configService.get('aws.region') });
  }

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
      sqs: this.sqsClient,
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
  }

  private async sendAwsSqsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.sqsClient.send(commandInstance);

    return response as TOutput;
  }

  private buildSendSqsMessageInput(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
  ): SendMessageCommandInput {
    const data = {
      createDeploymentData: dto,
      repository,
      accessToken,
      deploymentId,
      environmentId,
    };

    const input = {
      QueueUrl: this.configService.get('aws.sqs.queueUrl'),
      MessageBody: JSON.stringify(data),
    };

    return input;
  }

  private async sendSqsMessage(
    input: SendMessageCommandInput,
  ): Promise<SendMessageCommandOutput> {
    return this.sendAwsSqsCommand<
      SendMessageCommandInput,
      SendMessageCommandOutput
    >(SendMessageCommand, input);
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
  ): Promise<void> {
    const sendSqsMessageInput = this.buildSendSqsMessageInput(
      dto,
      repository,
      accessToken,
      deploymentId,
      environmentId,
    );
    await this.sendSqsMessage(sendSqsMessageInput);

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
