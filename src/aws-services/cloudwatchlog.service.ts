import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  DescribeLogStreamsCommandInput,
  DescribeLogStreamsCommandOutput,
  GetLogEventsCommand,
  GetLogEventsCommandInput,
  GetLogEventsCommandOutput,
} from '@aws-sdk/client-cloudwatch-logs';

@Injectable()
export class CloudWatchLogService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new CloudWatchLogsClient({
      region: configService.get('aws.region'),
    });
  }

  private buildDescribeLogStreamInput(
    logStreamPrefix: string,
  ): DescribeLogStreamsCommandInput {
    const input = {
      logGroupName: this.configService.get('aws.ecs.cloudwatchLogGroup'),
      logStreamNamePrefix: logStreamPrefix,
    };

    return input;
  }

  private async describeLogStream(
    input: DescribeLogStreamsCommandInput,
  ): Promise<DescribeLogStreamsCommandOutput> {
    return this.sendAwsCommand<
      DescribeLogStreamsCommandInput,
      DescribeLogStreamsCommandOutput
    >(DescribeLogStreamsCommand, input);
  }

  private buildGetLogEventsInput(
    logStreamName: string,
    limit: number,
  ): GetLogEventsCommandInput {
    const input = {
      logGroupName: this.configService.get('aws.ecs.cloudwatchLogGroup'),
      logStreamName: logStreamName,
      limit: limit,
    };

    return input;
  }

  private async getLogEvents(
    input: GetLogEventsCommandInput,
  ): Promise<GetLogEventsCommandOutput> {
    return this.sendAwsCommand<
      GetLogEventsCommandInput,
      GetLogEventsCommandOutput
    >(GetLogEventsCommand, input);
  }

  async getLogsForECS(name: string) {
    const describeLogStreamInput = this.buildDescribeLogStreamInput(name);

    console.log(describeLogStreamInput);

    const describeLogStreamResponse = await this.describeLogStream(
      describeLogStreamInput,
    );

    const getLogEventsInput = this.buildGetLogEventsInput(
      describeLogStreamResponse.logStreams[
        describeLogStreamResponse.logStreams.length - 1
      ].logStreamName,
      100,
    );

    console.log(getLogEventsInput);

    const getLogEventsResponse = await this.getLogEvents(getLogEventsInput);

    console.log(JSON.stringify(getLogEventsResponse));

    return getLogEventsResponse.events;
  }
}
