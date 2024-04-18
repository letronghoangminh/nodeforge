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
  GenerateAccessLogsCommand,
  GenerateAccessLogsCommandInput,
  GenerateAccessLogsCommandOutput,
  JobType,
  Stage,
  StartJobCommand,
  StartJobCommandInput,
  StartJobCommandOutput,
  UpdateAppCommand,
  UpdateAppCommandInput,
  UpdateAppCommandOutput,
} from '@aws-sdk/client-amplify';
import { Repository } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  AmplifyApplicationTypeMapping,
  AmplifyBuildSpecMapping,
  AmplifyFrameworkMapping,
  ConfigFilesMapping,
} from './mapping/amplify.mapping';
import { GithubService } from 'src/github/github.service';
import { OpenaiService } from 'src/openai/openai.service';
import { AmplifyFrameworkEnum } from './enum/amplify.enum';

@Injectable()
export class AmplifyService {
  private client: AmplifyClient;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private githubService: GithubService,
    private openaiService: OpenaiService,
  ) {
    this.client = new AmplifyClient({
      region: configService.get('aws.region'),
    });
  }

  private addAmplifyPlatform(input: CreateAppCommandInput, framework: string) {
    input.platform = AmplifyApplicationTypeMapping[framework];
  }

  private async addAmplifyBuildSpec(
    input: CreateAppCommandInput,
    framework: string,
    repository: Repository,
    userId: number,
  ) {
    const buildSpecOption = {
      framework: AmplifyFrameworkMapping[framework],
      exampleBuildSpec: AmplifyBuildSpecMapping[framework],
    };

    const packageJson = await this.githubService.getFileContent(
      ConfigFilesMapping['PACKAGE_JSON'],
      repository.name,
      repository.owner,
      repository.branch,
      userId,
    );

    if (packageJson) buildSpecOption['packageJson'] = packageJson;

    const viteConfig = await this.githubService.getFileContent(
      ConfigFilesMapping['VITE_CONFIG'],
      repository.name,
      repository.owner,
      repository.branch,
      userId,
    );

    if (viteConfig) buildSpecOption['viteConfig'] = viteConfig;

    const webpackConfig = await this.githubService.getFileContent(
      ConfigFilesMapping['WEBPACK_CONFIG'],
      repository.name,
      repository.owner,
      repository.branch,
      userId,
    );

    if (webpackConfig) buildSpecOption['webpackConfig'] = webpackConfig;

    switch (framework) {
      case AmplifyFrameworkEnum.NEXT: {
        const nextConfig = await this.githubService.getFileContent(
          ConfigFilesMapping['NEXT_CONFIG'],
          repository.name,
          repository.owner,
          repository.branch,
          userId,
        );

        if (nextConfig) buildSpecOption['nextConfig'] = nextConfig;
        break;
      }
      case AmplifyFrameworkEnum.NUXT: {
        const nuxtConfig = await this.githubService.getFileContent(
          ConfigFilesMapping['NUXT_CONFIG'],
          repository.name,
          repository.owner,
          repository.branch,
          userId,
        );

        if (nuxtConfig) buildSpecOption['nuxtConfig'] = nuxtConfig;
        break;
      }
      case AmplifyFrameworkEnum.ANGULAR: {
        const angularConfig = await this.githubService.getFileContent(
          ConfigFilesMapping['ANGULAR_CONFIG'],
          repository.name,
          repository.owner,
          repository.branch,
          userId,
        );

        if (angularConfig) buildSpecOption['angularConfig'] = angularConfig;
        break;
      }
      case AmplifyFrameworkEnum.SVELTE: {
        const svelteConfig = await this.githubService.getFileContent(
          ConfigFilesMapping['SVELTE_CONFIG'],
          repository.name,
          repository.owner,
          repository.branch,
          userId,
        );

        if (svelteConfig) buildSpecOption['svelteConfig'] = svelteConfig;
        break;
      }
      default: {
        break;
      }
    }

    const buildspec = await this.openaiService.generateAmplifyBuildSpec(
      buildSpecOption,
    );

    input.buildSpec = buildspec;
  }

  private async sendAwsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.client.send(commandInstance);

    return response as TOutput;
  }

  private async buildCreateAppInput(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    userId: number,
  ): Promise<CreateAppCommandInput> {
    const input = {
      name: dto.subdomain,
      repository: repository.url,
      accessToken: accessToken,
      enableBranchAutoBuild: true,
      environmentVariables: dto.envVars,
    };

    this.addAmplifyPlatform(input, dto.framework);
    await this.addAmplifyBuildSpec(input, dto.framework, repository, userId);

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
      framework: AmplifyFrameworkMapping[dto.framework],
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
    branch: string,
    appId: string,
  ): StartJobCommandInput {
    return {
      appId: appId,
      branchName: branch,
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

  private buildGetLogsInput(appId: string): GenerateAccessLogsCommandInput {
    return {
      appId: appId,
      domainName: this.configService.get('app.domain'),
    };
  }

  private async getLogs(
    input: GenerateAccessLogsCommandInput,
  ): Promise<GenerateAccessLogsCommandOutput> {
    return this.sendAwsCommand<
      GenerateAccessLogsCommandInput,
      GenerateAccessLogsCommandOutput
    >(GenerateAccessLogsCommand, input);
  }

  private async deleteApp(
    input: DeleteAppCommandInput,
  ): Promise<DeleteAppCommandOutput> {
    return this.sendAwsCommand<DeleteAppCommandInput, DeleteAppCommandOutput>(
      DeleteAppCommand,
      input,
    );
  }

  private async updateApp(
    input: UpdateAppCommandInput,
  ): Promise<UpdateAppCommandOutput> {
    return this.sendAwsCommand<UpdateAppCommandInput, UpdateAppCommandOutput>(
      UpdateAppCommand,
      input,
    );
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
    userId: number,
  ): Promise<void> {
    const createAppInput = await this.buildCreateAppInput(
      dto,
      repository,
      accessToken,
      userId,
    );
    const appData = await this.createAmplifyApp(createAppInput);

    const createBranchInput = this.buildCreateBranchInput(
      dto,
      appData.app.appId,
    );
    await this.createAmplifyBranch(createBranchInput);

    const startDeploymentInput = this.buildStartDeploymentInput(
      dto.repositoryBranch,
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
        productionBranch: dto.repositoryBranch,
      },
    });
  }

  async deleteDeployment(appId: string): Promise<void> {
    const deleteAppInput = {
      appId: appId,
    };
    await this.deleteApp(deleteAppInput);

    await this.prismaService.amplifyConfiguration.delete({
      where: {
        appId: appId,
      },
    });
  }

  async updateEnvironment(
    appId: string,
    envVars: Record<string, string>,
    branch: string,
  ): Promise<void> {
    const updateAppInput = {
      appId: appId,
      environmentVariables: envVars,
    };
    await this.updateApp(updateAppInput);

    const startDeploymentInput = this.buildStartDeploymentInput(branch, appId);
    await this.startDeployment(startDeploymentInput);
  }

  async getDeploymentLogs(appId: string): Promise<void> {
    const input = this.buildGetLogsInput(appId);
    const logs = await this.getLogs(input);

    console.log(logs.logUrl);
  }
}
