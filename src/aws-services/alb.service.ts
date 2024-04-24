import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  ActionTypeEnum,
  CreateRuleCommand,
  CreateRuleCommandInput,
  CreateRuleCommandOutput,
  CreateTargetGroupCommand,
  CreateTargetGroupCommandInput,
  CreateTargetGroupCommandOutput,
  ElasticLoadBalancingV2Client,
  ProtocolEnum,
  TargetTypeEnum,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class AlbService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new ElasticLoadBalancingV2Client({
      region: configService.get('aws.region'),
    });
  }

  private async buildCreateTargetGroupInput(
    dto: CreateDeploymentDto,
  ): Promise<CreateTargetGroupCommandInput> {
    const input = {
      Name: `${dto.name}-tg`,
      Port: 8000,
      Protocol: ProtocolEnum.HTTP,
      VpcId: this.configService.get('aws.vpc.vpcId'),
      HealthCheckProtocol: ProtocolEnum.HTTP,
      HealthCheckPort: '8000',
      HealthCheckEnabled: true,
      HealthCheckPath: '/api/docs',
      HealthCheckIntervalSeconds: 120,
      HealthCheckTimeoutSeconds: 60,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 7,
      TargetType: TargetTypeEnum.IP,
    };

    return input;
  }

  async createTargetGroup(
    input: CreateTargetGroupCommandInput,
  ): Promise<CreateTargetGroupCommandOutput> {
    return this.sendAwsCommand<
      CreateTargetGroupCommandInput,
      CreateTargetGroupCommandOutput
    >(CreateTargetGroupCommand, input);
  }

  async buildCreateListenerRuleInput(
    dnsName: string,
    targetGroupArn: string,
  ): Promise<CreateRuleCommandInput> {
    const input = {
      ListenerArn: this.configService.get('aws.alb.listenerArn'),
      Conditions: [
        {
          HostHeaderConfig: {
            Values: [dnsName],
          },
        },
      ],
      Priority: 100,
      Actions: [
        {
          Type: ActionTypeEnum.FORWARD,
          TargetGroupArn: targetGroupArn,
        },
      ],
    };

    return input;
  }

  async createListenerRule(
    input: CreateRuleCommandInput,
  ): Promise<CreateRuleCommandOutput> {
    return this.sendAwsCommand<CreateRuleCommandInput, CreateRuleCommandOutput>(
      CreateRuleCommand,
      input,
    );
  }
}
