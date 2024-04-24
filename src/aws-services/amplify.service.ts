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
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from '@prisma/client';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { AmplifyFrameworkEnum } from 'src/frontend/enum/frontend.enum';
import {
  AmplifyApplicationTypeMapping,
  AmplifyBuildSpecMapping,
  AmplifyFrameworkMapping,
  ConfigFilesMapping,
} from 'src/frontend/mapping/frontend.mapping';
import { GithubService } from 'src/github/github.service';
import { OpenaiService } from 'src/openai/openai.service';
import { AwsService } from './base.class';

@Injectable()
export class AmplifyService extends AwsService {
  constructor(
    private configService: ConfigService,
    private githubService: GithubService,
    private openaiService: OpenaiService,
  ) {
    super();
    this.client = new AmplifyClient({
      region: configService.get('aws.region'),
    });
  }

  addAmplifyPlatform(input: CreateAppCommandInput, framework: string) {
    input.platform = AmplifyApplicationTypeMapping[framework];
  }

  async addAmplifyBuildSpec(
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

  async buildCreateAppInput(
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

  async createAmplifyApp(
    input: CreateAppCommandInput,
  ): Promise<CreateAppCommandOutput> {
    return this.sendAwsCommand<CreateAppCommandInput, CreateAppCommandOutput>(
      CreateAppCommand,
      input,
    );
  }

  buildCreateBranchInput(
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

  async createAmplifyBranch(
    input: CreateBranchCommandInput,
  ): Promise<CreateBranchCommandOutput> {
    return this.sendAwsCommand<
      CreateBranchCommandInput,
      CreateBranchCommandOutput
    >(CreateBranchCommand, input);
  }

  buildStartDeploymentInput(
    branch: string,
    appId: string,
  ): StartJobCommandInput {
    return {
      appId: appId,
      branchName: branch,
      jobType: 'RELEASE' as JobType,
    };
  }

  async startDeployment(
    input: StartJobCommandInput,
  ): Promise<StartJobCommandOutput> {
    return this.sendAwsCommand<StartJobCommandInput, StartJobCommandOutput>(
      StartJobCommand,
      input,
    );
  }

  buildCreateDomainAssociationInput(
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

  async createDomainAssociation(
    input: CreateDomainAssociationCommandInput,
  ): Promise<CreateDomainAssociationCommandOutput> {
    return this.sendAwsCommand<
      CreateDomainAssociationCommandInput,
      CreateDomainAssociationCommandOutput
    >(CreateDomainAssociationCommand, input);
  }

  buildGetLogsInput(appId: string): GenerateAccessLogsCommandInput {
    return {
      appId: appId,
      domainName: this.configService.get('app.domain'),
    };
  }

  async getLogs(
    input: GenerateAccessLogsCommandInput,
  ): Promise<GenerateAccessLogsCommandOutput> {
    return this.sendAwsCommand<
      GenerateAccessLogsCommandInput,
      GenerateAccessLogsCommandOutput
    >(GenerateAccessLogsCommand, input);
  }

  async deleteApp(
    input: DeleteAppCommandInput,
  ): Promise<DeleteAppCommandOutput> {
    return this.sendAwsCommand<DeleteAppCommandInput, DeleteAppCommandOutput>(
      DeleteAppCommand,
      input,
    );
  }

  async updateApp(
    input: UpdateAppCommandInput,
  ): Promise<UpdateAppCommandOutput> {
    return this.sendAwsCommand<UpdateAppCommandInput, UpdateAppCommandOutput>(
      UpdateAppCommand,
      input,
    );
  }
}
