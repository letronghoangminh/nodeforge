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
import {
  AssignPublicIp,
  Compatibility,
  CreateServiceCommand,
  CreateServiceCommandInput,
  CreateServiceCommandOutput,
  ECSClient,
  LaunchType,
  NetworkMode,
  RegisterTaskDefinitionCommand,
  RegisterTaskDefinitionCommandInput,
  RegisterTaskDefinitionCommandOutput,
  SchedulingStrategy,
  TransportProtocol,
} from '@aws-sdk/client-ecs';
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
import {
  ChangeAction,
  ChangeResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommandInput,
  ChangeResourceRecordSetsCommandOutput,
  Route53Client,
  RRType,
} from '@aws-sdk/client-route-53';

@Injectable()
export class EcsService {
  private sqsClient: SQSClient;
  private ecsClient: ECSClient;
  private albClient: ElasticLoadBalancingV2Client;
  private r53Client: Route53Client;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.sqsClient = new SQSClient({ region: configService.get('aws.region') });
    this.ecsClient = new ECSClient({ region: configService.get('aws.region') });
    this.albClient = new ElasticLoadBalancingV2Client({
      region: configService.get('aws.region'),
    });
    this.r53Client = new Route53Client({
      region: configService.get('aws.region'),
    });
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

  private async sendAwsSqsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.sqsClient.send(commandInstance);

    return response as TOutput;
  }

  private async sendAwsEcsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.ecsClient.send(commandInstance);

    return response as TOutput;
  }

  private async sendAwsAlbCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.albClient.send(commandInstance);

    return response as TOutput;
  }

  private async sendAwsR53Command<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.r53Client.send(commandInstance);

    return response as TOutput;
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

    const dockerImage = await this.buildDockerImage(
      createDeploymentData,
      repository,
      accessToken,
    );

    await this.deployEcsService(
      createDeploymentData,
      environmentId,
      dockerImage,
    );
  }

  private async buildDockerImage(
    createDeploymentData: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
  ): Promise<string> {
    return `100117910916.dkr.ecr.ap-southeast-1.amazonaws.com/nodeforge-ecs:${createDeploymentData.name}`;
  }

  private async buildRegisterTaskDefinitionInput(
    dto: CreateDeploymentDto,
    dockerImage: string,
    environmentId: number,
  ): Promise<RegisterTaskDefinitionCommandInput> {
    const environment = await this.prismaService.environment.findFirst({
      where: {
        id: environmentId,
      },
      select: {
        envVars: true,
      },
    });

    const envVars: Record<string, string> = JSON.parse(
      JSON.stringify(environment.envVars),
    );

    const input = {
      family: `${dto.name}-task`,
      networkMode: NetworkMode.AWSVPC,
      requiresCompatibilities: [Compatibility.FARGATE],
      cpu: '.25',
      memory: '512',
      containerDefinitions: [
        {
          name: `${dto.name}-container`,
          image: dockerImage,
          essential: true,
          portMappings: [
            {
              containerPort: 8000,
              hostPort: 8000,
              protocol: TransportProtocol.TCP,
            },
          ],
          environment: Object.entries(envVars).map(([name, value]) => {
            return { name, value };
          }),
        },
      ],
    };

    return input;
  }

  private async registerTaskDefinition(
    input: RegisterTaskDefinitionCommandInput,
  ): Promise<RegisterTaskDefinitionCommandOutput> {
    return this.sendAwsEcsCommand<
      RegisterTaskDefinitionCommandInput,
      RegisterTaskDefinitionCommandOutput
    >(RegisterTaskDefinitionCommand, input);
  }

  private async buildCreateServiceInput(
    dto: CreateDeploymentDto,
    taskDefinitionArn: string,
    targetGroupArn: string,
  ): Promise<CreateServiceCommandInput> {
    const input = {
      cluster: this.configService.get('aws.ecs.clusterName'),
      serviceName: dto.name,
      desiredCount: 1,
      taskDefinition: taskDefinitionArn,
      loadBalancers: [
        {
          targetGroupArn: targetGroupArn,
          containerName: `${dto.name}-container`,
          containerPort: 8000,
        },
      ],
      launchType: LaunchType.FARGATE,
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
      },
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: AssignPublicIp.DISABLED,
          subnets: (
            this.configService.get('aws.vpc.subnetIds') as string
          ).split(','),
          securityGroups: (
            this.configService.get('aws.vpc.secgroupIds') as string
          ).split(','),
        },
      },
      healthCheckGracePeriodSeconds: 60,
      schedulingStrategy: SchedulingStrategy.REPLICA,
      enableExecuteCommand: true,
    };

    return input;
  }

  private async createService(
    input: CreateServiceCommandInput,
  ): Promise<CreateServiceCommandOutput> {
    return this.sendAwsEcsCommand<
      CreateServiceCommandInput,
      CreateServiceCommandOutput
    >(CreateServiceCommand, input);
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

  private async createTargetGroup(
    input: CreateTargetGroupCommandInput,
  ): Promise<CreateTargetGroupCommandOutput> {
    return this.sendAwsAlbCommand<
      CreateTargetGroupCommandInput,
      CreateTargetGroupCommandOutput
    >(CreateTargetGroupCommand, input);
  }

  private async buildCreateListenerRuleInput(
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

  private async createListenerRule(
    input: CreateRuleCommandInput,
  ): Promise<CreateRuleCommandOutput> {
    return this.sendAwsAlbCommand<
      CreateRuleCommandInput,
      CreateRuleCommandOutput
    >(CreateRuleCommand, input);
  }

  private async buildCreateR53RecordInput(
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

  private async createR53Record(
    input: ChangeResourceRecordSetsCommandInput,
  ): Promise<ChangeResourceRecordSetsCommandOutput> {
    return this.sendAwsR53Command<
      ChangeResourceRecordSetsCommandInput,
      ChangeResourceRecordSetsCommandOutput
    >(ChangeResourceRecordSetsCommand, input);
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

  private async deployEcsService(
    createDeploymentData: CreateDeploymentDto,
    environmentId: number,
    dockerImage: string,
  ): Promise<void> {
    const registerTaskDefinitionInput =
      await this.buildRegisterTaskDefinitionInput(
        createDeploymentData,
        dockerImage,
        environmentId,
      );
    const taskDefReseponse = await this.registerTaskDefinition(
      registerTaskDefinitionInput,
    );
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
