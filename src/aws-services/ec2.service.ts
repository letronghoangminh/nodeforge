import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './base.class';
import {
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupIngressCommandInput,
  AuthorizeSecurityGroupIngressCommandOutput,
  AuthorizeSecurityGroupEgressCommandInput,
  AuthorizeSecurityGroupEgressCommandOutput,
  AuthorizeSecurityGroupEgressCommand,
  CreateSecurityGroupCommand,
  CreateSecurityGroupCommandInput,
  CreateSecurityGroupCommandOutput,
  EC2Client,
  Protocol,
} from '@aws-sdk/client-ec2';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class Ec2Service extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new EC2Client({
      region: configService.get('aws.region'),
    });
  }

  buildCreateSecurityGroupInput(
    dto: CreateDeploymentDto,
  ): CreateSecurityGroupCommandInput {
    const input = {
      Description: 'Allow inbound HTTP traffic to service from ALB only',
      GroupName: `${dto.name}-sg`,
      VpcId: this.configService.get('aws.vpc.vpcId'),
    };

    return input;
  }

  async createSecurityGroup(
    input: CreateSecurityGroupCommandInput,
  ): Promise<CreateSecurityGroupCommandOutput> {
    return this.sendAwsCommand<
      CreateSecurityGroupCommandInput,
      CreateSecurityGroupCommandOutput
    >(CreateSecurityGroupCommand, input);
  }

  buildCreateIngressRuleInput(
    secgroupId: string,
  ): AuthorizeSecurityGroupIngressCommandInput {
    const albSecgroupName = this.configService.get('aws.alb.secgroupName');

    const input = {
      FromPort: 8000,
      ToPort: 8000,
      IpProtocol: Protocol.tcp,
      SourceSecurityGroupName: albSecgroupName,
      GroupId: secgroupId,
    };

    return input;
  }

  async createIngressRule(
    input: AuthorizeSecurityGroupIngressCommandInput,
  ): Promise<AuthorizeSecurityGroupIngressCommandOutput> {
    return this.sendAwsCommand<
      AuthorizeSecurityGroupIngressCommandInput,
      AuthorizeSecurityGroupIngressCommandOutput
    >(AuthorizeSecurityGroupIngressCommand, input);
  }

  buildCreateEgressRuleInput(
    secgroupId: string,
  ): AuthorizeSecurityGroupEgressCommandInput {
    const input = {
      GroupId: secgroupId,
      FromPort: 0,
      ToPort: 0,
      CidrIp: '0.0.0.0/0',
      IpProtocol: Protocol.tcp,
    };

    return input;
  }

  async createEgressRule(
    input: AuthorizeSecurityGroupEgressCommandInput,
  ): Promise<AuthorizeSecurityGroupIngressCommandOutput> {
    return this.sendAwsCommand<
      AuthorizeSecurityGroupEgressCommandInput,
      AuthorizeSecurityGroupEgressCommandOutput
    >(AuthorizeSecurityGroupEgressCommand, input);
  }
}
