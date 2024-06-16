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
  OrderBy,
} from '@aws-sdk/client-cloudwatch-logs';

@Injectable()
export class CloudWatchLogService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new CloudWatchLogsClient({
      region: configService.get('aws.region'),
    });
  }

  private buildDescribeLogStreamInput(): DescribeLogStreamsCommandInput {
    const input = {
      logGroupName: this.configService.get('aws.ecs.cloudwatchLogGroup'),
      // logStreamNamePrefix: logStreamPrefix,
      orderBy: OrderBy.LastEventTime,
      descending: true,
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
    const describeLogStreamInput = this.buildDescribeLogStreamInput();

    const describeLogStreamResponse = await this.describeLogStream(
      describeLogStreamInput,
    );

    let logStreamName;

    describeLogStreamResponse.logStreams.map((logStream) => {
      if (logStream.logStreamName.startsWith(name)) {
        logStreamName = logStream.logStreamName;
      }
    });

    if (!logStreamName) return [];

    const getLogEventsInput = this.buildGetLogEventsInput(logStreamName, 100);

    console.log(getLogEventsInput);

    const getLogEventsResponse = await this.getLogEvents(getLogEventsInput);

    return getLogEventsResponse.events;
  }
}
