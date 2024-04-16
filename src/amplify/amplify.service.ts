import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AmplifyClient,
  CreateAppCommand,
  CreateAppCommandInput,
  CreateAppCommandOutput,
  CreateBranchCommand,
  CreateBranchCommandInput,
  CreateBranchCommandOutput,
  CreateDomainAssociationCommand,
  CreateDomainAssociationCommandInput,
  CreateDomainAssociationCommandOutput,
  DeleteAppCommand,
  DeleteAppCommandInput,
  DeleteAppCommandOutput,
  JobType,
  Stage,
  StartJobCommand,
  StartJobCommandInput,
  StartJobCommandOutput,
} from '@aws-sdk/client-amplify';
import { Repository } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { FrameworkEnum } from './enum/amplify.enum';
import {
  AmplifyApplicationTypeMapping,
  AmplifyBuildSpecMapping,
} from './mapping/amplify.mapping';

@Injectable()
export class AmplifyService {
  private client: AmplifyClient;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.client = new AmplifyClient({
      region: configService.get('aws.region'),
    });
  }

  private addAmplifyPlatform(input: CreateAppCommandInput, framework: string) {
    input.platform = AmplifyApplicationTypeMapping[framework];
  }

  private addAmplifyBuildSpec(input: CreateAppCommandInput, framework: string) {
    input.buildSpec = AmplifyBuildSpecMapping[framework];
  }

  private async sendAwsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.client.send(commandInstance);

    return response as TOutput;
  }

  private buildCreateAppInput(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
  ): CreateAppCommandInput {
    const input = {
      name: dto.subdomain,
      repository: repository.url,
      accessToken: accessToken,
      enableBranchAutoBuild: true,
      environmentVariables: dto.envVars,
    };

    this.addAmplifyPlatform(input, dto.framework);
    this.addAmplifyBuildSpec(input, dto.framework);

    return input;
  }

  private async createAmplifyApp(
    input: CreateAppCommandInput,
  ): Promise<CreateAppCommandOutput> {
    return this.sendAwsCommand<CreateAppCommandInput, CreateAppCommandOutput>(
      CreateAppCommand,
      input,
    );
  }

  private buildCreateBranchInput(
    dto: CreateDeploymentDto,
    appId: string,
  ): CreateBranchCommandInput {
    return {
      appId: appId,
      branchName: dto.repositoryBranch,
      stage: 'PRODUCTION' as Stage,
      framework: dto.framework,
      enableAutoBuild: true,
    };
  }

  private async createAmplifyBranch(
    input: CreateBranchCommandInput,
  ): Promise<CreateBranchCommandOutput> {
    return this.sendAwsCommand<
      CreateBranchCommandInput,
      CreateBranchCommandOutput
    >(CreateBranchCommand, input);
  }

  private buildStartDeploymentInput(
    dto: CreateDeploymentDto,
    appId: string,
  ): StartJobCommandInput {
    return {
      appId: appId,
      branchName: dto.repositoryBranch,
      jobType: 'RELEASE' as JobType,
    };
  }

  private async startDeployment(
    input: StartJobCommandInput,
  ): Promise<StartJobCommandOutput> {
    return this.sendAwsCommand<StartJobCommandInput, StartJobCommandOutput>(
      StartJobCommand,
      input,
    );
  }

  private buildCreateDomainAssociationInput(
    dto: CreateDeploymentDto,
    appId: string,
  ): CreateDomainAssociationCommandInput {
    return {
      appId: appId,
      domainName: this.configService.get('app.domain'),
      certificateSettings: {
        type: 'AMPLIFY_MANAGED',
      },
      subDomainSettings: [
        {
          branchName: dto.repositoryBranch,
          prefix: dto.subdomain,
        },
      ],
    };
  }

  private async createDomainAssociation(
    input: CreateDomainAssociationCommandInput,
  ): Promise<CreateDomainAssociationCommandOutput> {
    return this.sendAwsCommand<
      CreateDomainAssociationCommandInput,
      CreateDomainAssociationCommandOutput
    >(CreateDomainAssociationCommand, input);
  }

  private async deleteApp(
    input: DeleteAppCommandInput,
  ): Promise<DeleteAppCommandOutput> {
    return this.sendAwsCommand<DeleteAppCommandInput, DeleteAppCommandOutput>(
      DeleteAppCommand,
      input,
    );
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
  ): Promise<void> {
    const createAppInput = this.buildCreateAppInput(
      dto,
      repository,
      accessToken,
    );
    const appData = await this.createAmplifyApp(createAppInput);

    const createBranchInput = this.buildCreateBranchInput(
      dto,
      appData.app.appId,
    );
    await this.createAmplifyBranch(createBranchInput);

    const startDeploymentInput = this.buildStartDeploymentInput(
      dto,
      appData.app.appId,
    );
    await this.startDeployment(startDeploymentInput);

    const createDomainAssociationInput = this.buildCreateDomainAssociationInput(
      dto,
      appData.app.appId,
    );
    await this.createDomainAssociation(createDomainAssociationInput);

    await this.prismaService.amplifyConfiguration.create({
      data: {
        deploymentId,
        appId: appData.app.appId,
        subdomain: dto.subdomain,
        environmentId: environmentId,
      },
    });

    // switch (dto.framework) {
    //   case FrameworkEnum.NEXT: {
    //     // config backend
    //     break;
    //   }

    //   default: {
    //     break;
    //   }
    // }
  }

  async deleteDeployment(deploymentId: number): Promise<void> {
    const amplifyConfiguration =
      await this.prismaService.amplifyConfiguration.findFirst({
        where: {
          deploymentId,
        },
        select: {
          appId: true,
          id: true,
          environmentId: true,
        },
      });

    const input = {
      appId: amplifyConfiguration.appId,
    };

    await this.deleteApp(input);

    await this.prismaService.amplifyConfiguration.delete({
      where: {
        id: amplifyConfiguration.id,
      },
    });

    await this.prismaService.environment.delete({
      where: {
        id: amplifyConfiguration.environmentId,
      },
    });
  }
}
