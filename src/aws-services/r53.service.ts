import { Injectable } from '@nestjs/common';
import { AwsService } from './base.class';
import { ConfigService } from '@nestjs/config';
import {
  ChangeAction,
  ChangeResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommandInput,
  ChangeResourceRecordSetsCommandOutput,
  Route53Client,
  RRType,
} from '@aws-sdk/client-route-53';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class R53Service extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new Route53Client({
      region: configService.get('aws.region'),
    });
  }

  async buildCreateR53RecordInput(
    dto: CreateDeploymentDto,
  ): Promise<ChangeResourceRecordSetsCommandInput> {
    const input = {
      HostedZoneId: this.configService.get('aws.r53.zoneId'),
      ChangeBatch: {
        Changes: [
          {
            Action: ChangeAction.CREATE,
            ResourceRecordSet: {
              Name: `${dto.subdomain}.${this.configService.get('app.domain')}`,
              Type: RRType.A,
              AliasTarget: {
                HostedZoneId: this.configService.get('aws.alb.zoneId'),
                DNSName: this.configService.get('aws.alb.zoneId'),
                EvaluateTargetHealth: true,
              },
            },
          },
        ],
      },
    };

    return input;
  }

  async createR53Record(
    input: ChangeResourceRecordSetsCommandInput,
  ): Promise<ChangeResourceRecordSetsCommandOutput> {
    return this.sendAwsCommand<
      ChangeResourceRecordSetsCommandInput,
      ChangeResourceRecordSetsCommandOutput
    >(ChangeResourceRecordSetsCommand, input);
  }
}
