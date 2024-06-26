import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './base.class';
import {
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupIngressCommandInput,
  AuthorizeSecurityGroupIngressCommandOutput,
  // AuthorizeSecurityGroupEgressCommandInput,
  // AuthorizeSecurityGroupEgressCommandOutput,
  // AuthorizeSecurityGroupEgressCommand,
  CreateSecurityGroupCommand,
  CreateSecurityGroupCommandInput,
  CreateSecurityGroupCommandOutput,
  DeleteSecurityGroupCommand,
  DeleteSecurityGroupCommandInput,
  DeleteSecurityGroupCommandOutput,
  EC2Client,
  Protocol,
} from '@aws-sdk/client-ec2';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { genRandomString } from 'src/helpers/helpers';

@Injectable()
export class Ec2Service extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new EC2Client({
      region: configService.get('aws.region'),
    });
  }

  private buildCreateSecurityGroupInput(
    dto: CreateDeploymentDto,
  ): CreateSecurityGroupCommandInput {
    const input = {
      Description: 'Allow inbound HTTP traffic to service from ALB only',
      GroupName: `ecs-${dto.name}-sg-${genRandomString(5)}`,
      VpcId: this.configService.get('aws.vpc.vpcId'),
    };

    return input;
  }

  private async createSecurityGroup(
    input: CreateSecurityGroupCommandInput,
  ): Promise<CreateSecurityGroupCommandOutput> {
    return this.sendAwsCommand<
      CreateSecurityGroupCommandInput,
      CreateSecurityGroupCommandOutput
    >(CreateSecurityGroupCommand, input);
  }

  private buildCreateIngressRuleInput(
    secgroupId: string,
  ): AuthorizeSecurityGroupIngressCommandInput {
    const input = {
      GroupId: secgroupId,
      IpPermissions: [
        {
          FromPort: 8000,
          ToPort: 8000,
          IpProtocol: Protocol.tcp,
          UserIdGroupPairs: [
            {
              GroupId: this.configService.get('aws.alb.secgroupId'),
            },
          ],
        },
      ],
    };

    return input;
  }

  private async createIngressRule(
    input: AuthorizeSecurityGroupIngressCommandInput,
  ): Promise<AuthorizeSecurityGroupIngressCommandOutput> {
    return this.sendAwsCommand<
      AuthorizeSecurityGroupIngressCommandInput,
      AuthorizeSecurityGroupIngressCommandOutput
    >(AuthorizeSecurityGroupIngressCommand, input);
  }

  // private buildCreateEgressRuleInput(
  //   secgroupId: string,
  // ): AuthorizeSecurityGroupEgressCommandInput {
  //   const input = {
  //     GroupId: secgroupId,
  //     FromPort: 0,
  //     ToPort: 0,
  //     CidrIp: '0.0.0.0/0',
  //     IpProtocol: Protocol.tcp,
  //   };

  //   return input;
  // }

  // private async createEgressRule(
  //   input: AuthorizeSecurityGroupEgressCommandInput,
  // ): Promise<AuthorizeSecurityGroupIngressCommandOutput> {
  //   return this.sendAwsCommand<
  //     AuthorizeSecurityGroupEgressCommandInput,
  //     AuthorizeSecurityGroupEgressCommandOutput
  //   >(AuthorizeSecurityGroupEgressCommand, input);
  // }

  private buildDeleteSecurityGroupInput(
    secgroupId: string,
  ): DeleteSecurityGroupCommandInput {
    const input = {
      GroupId: secgroupId,
    };

    return input;
  }

  private async deleteSecurityGroup(
    input: DeleteSecurityGroupCommandInput,
  ): Promise<DeleteSecurityGroupCommandOutput> {
    return this.sendAwsCommand<
      DeleteSecurityGroupCommandInput,
      DeleteSecurityGroupCommandOutput
    >(DeleteSecurityGroupCommand, input);
  }

  async createSecurityGroupForECS(dto: CreateDeploymentDto): Promise<string> {
    const createSecurityGroupInput = this.buildCreateSecurityGroupInput(dto);

    const secgroupResponse = await this.createSecurityGroup(
      createSecurityGroupInput,
    );

    const secgroupId = secgroupResponse.GroupId;

    const createIngressRuleInput = this.buildCreateIngressRuleInput(secgroupId);

    await this.createIngressRule(createIngressRuleInput);

    // const createEgressRuleInput = this.buildCreateEgressRuleInput(secgroupId);

    // await this.createEgressRule(createEgressRuleInput);

    return secgroupId;
  }

  async deleteSecurityGroupForECS(secgroupId: string) {
    const deleteSecuruityGroupInput =
      this.buildDeleteSecurityGroupInput(secgroupId);

    await this.deleteSecurityGroup(deleteSecuruityGroupInput);
  }
}
