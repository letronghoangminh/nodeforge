import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  GetMetricStatisticsCommandInput,
  GetMetricStatisticsCommandOutput,
  Statistic,
} from '@aws-sdk/client-cloudwatch';

@Injectable()
export class CloudWatchService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new CloudWatchClient({
      region: configService.get('aws.region'),
    });
  }

  private buildGetMetricStatisticsInput(
    metricName: string,
    serviceName: string,
  ): GetMetricStatisticsCommandInput {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    const input = {
      Namespace: 'AWS/ECS',
      MetricName: metricName,
      Dimensions: [
        {
          Name: 'ClusterName',
          Value: this.configService.get('aws.ecs.clusterName'),
        },
        {
          Name: 'ServiceName',
          Value: serviceName,
        },
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: [Statistic.Average],
    };

    return input;
  }

  private async getMetricStatistics(
    input: GetMetricStatisticsCommandInput,
  ): Promise<GetMetricStatisticsCommandOutput> {
    return this.sendAwsCommand<
      GetMetricStatisticsCommandInput,
      GetMetricStatisticsCommandOutput
    >(GetMetricStatisticsCommand, input);
  }

  async getHealthMetricsForECS(serviceName: string) {
    const cpuMetric = this.buildGetMetricStatisticsInput(
      serviceName,
      'CPUUtilization',
    );

    const cpuMetricResponse = await this.getMetricStatistics(cpuMetric);

    const memoryMetric = this.buildGetMetricStatisticsInput(
      serviceName,
      'MemoryUtilization',
    );

    const memoryMetricResponse = await this.getMetricStatistics(memoryMetric);

    console.log(JSON.stringify(cpuMetricResponse.Datapoints));
    console.log(JSON.stringify(memoryMetricResponse.Datapoints));
  }
}
