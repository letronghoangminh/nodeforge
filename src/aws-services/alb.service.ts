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

  private buildCreateTargetGroupInput(
    dto: CreateDeploymentDto,
  ): CreateTargetGroupCommandInput {
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

  private async createTargetGroup(
    input: CreateTargetGroupCommandInput,
  ): Promise<CreateTargetGroupCommandOutput> {
    return this.sendAwsCommand<
      CreateTargetGroupCommandInput,
      CreateTargetGroupCommandOutput
    >(CreateTargetGroupCommand, input);
  }

  private buildCreateListenerRuleInput(
    dnsName: string,
    targetGroupArn: string,
  ): CreateRuleCommandInput {
    const input = {
      ListenerArn: this.configService.get('aws.alb.listenerArn'),
      Conditions: [
        {
          Field: 'host-header',
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

  private async createListenerRule(
    input: CreateRuleCommandInput,
  ): Promise<CreateRuleCommandOutput> {
    return this.sendAwsCommand<CreateRuleCommandInput, CreateRuleCommandOutput>(
      CreateRuleCommand,
      input,
    );
  }

  async createTargetGroupForEcs(dto: CreateDeploymentDto): Promise<string> {
    const createTargetGroupInput = this.buildCreateTargetGroupInput(dto);

    const targetGroupResponse = await this.createTargetGroup(
      createTargetGroupInput,
    );

    const targetGroupArn = targetGroupResponse.TargetGroups[0].TargetGroupArn;

    const createListenerRuleInput = this.buildCreateListenerRuleInput(
      `${dto.subdomain}.${this.configService.get('app.domain')}`,
      targetGroupArn,
    );

    await this.createListenerRule(createListenerRuleInput);

    return targetGroupArn;
  }
}
