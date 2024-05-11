import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import {
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { Repository } from '@prisma/client';
import { genRandomString } from 'src/helpers/helpers';

@Injectable()
export class SqsService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new SQSClient({
      region: configService.get('aws.region'),
    });
  }

  buildSendSqsMessageInput(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
    eventType: string,
  ): SendMessageCommandInput {
    const data = {
      createDeploymentData: dto,
      repository,
      accessToken,
      deploymentId,
      environmentId,
      eventType,
      eventId: genRandomString(15),
    };

    const input = {
      QueueUrl: this.configService.get('aws.sqs.queueUrl'),
      MessageBody: JSON.stringify(data),
    };

    return input;
  }

  async sendSqsMessage(
    input: SendMessageCommandInput,
  ): Promise<SendMessageCommandOutput> {
    return this.sendAwsCommand<
      SendMessageCommandInput,
      SendMessageCommandOutput
    >(SendMessageCommand, input);
  }
}
