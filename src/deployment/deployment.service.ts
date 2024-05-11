import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateDeploymentDto,
  UpdateEnvironmentDto,
} from './dto/deployment.dto';
import { DeploymentModel, EnvironmentModel } from './model/deployment.model';
import { FrontendService } from 'src/frontend/frontend.service';
import {
  DeploymentStatus,
  DeploymentType,
  Environment,
  Repository,
  SubscriptionType,
} from '@prisma/client';
import { PlainToInstance } from 'src/helpers/helpers';
import { GithubService } from 'src/github/github.service';
import { OpenaiService } from 'src/openai/openai.service';
import { BackendService } from 'src/backend/backend.service';

@Injectable()
export class DeploymentService {
  constructor(
    private prismaService: PrismaService,
    private frontendService: FrontendService,
    private githubService: GithubService,
    private openaiService: OpenaiService,
    private backendService: BackendService,
  ) {}

  async checkSubdomain(subdomain: string) {
    const amplifyApp = await this.prismaService.amplifyConfiguration.findFirst({
      where: {
        subdomain: subdomain,
      },
    });

    const ecsApp = await this.prismaService.eCSConfiguration.findFirst({
      where: {
        subdomain: subdomain,
      },
    });

    if (amplifyApp || ecsApp)
      throw new ForbiddenException('This subdomain is already taken');
  }

  async createRepository(
    name: string,
    branch: string,
    url: string,
    owner: string,
    userId: number,
  ): Promise<Repository> {
    const githubProfile = await this.prismaService.githubProfile.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!githubProfile)
      throw new ForbiddenException('Please connect your Github profile first');

    const existingRepository = await this.prismaService.repository.findFirst({
      where: {
        name,
        githubProfileId: githubProfile.id,
      },
    });

    if (existingRepository)
      throw new ForbiddenException(
        "Can't connect one repository to many deployments",
      );

    const repository = await this.prismaService.repository.create({
      data: {
        branch,
        name,
        githubProfileId: githubProfile.id,
        url,
        owner,
      },
    });

    return repository;
  }

  async getGithubAccessToken(userId: number): Promise<string> {
    const githubProfile = await this.prismaService.githubProfile.findFirst({
      where: {
        userId,
      },
    });

    return await this.githubService.createInstallationAccessToken(
      githubProfile.installationId,
    );
  }

  async checkProSubscription(userId: number): Promise<void> {
    const subscription = await this.prismaService.subscription.findFirst({
      where: {
        userId,
      },
    });

    if (subscription.type === SubscriptionType.PRO) return;

    const deployments = await this.prismaService.deployment.findMany({
      where: {
        userId,
      },
    });

    if (deployments.length == 2)
      throw new ForbiddenException(
        'Please upgrade your subscription to PRO to deploy more than 2 applications',
      );
  }

  private async createEnvironment(
    envVars: Record<string, string>,
  ): Promise<Environment> {
    return await this.prismaService.environment.create({
      data: {
        envVars: envVars,
      },
    });
  }

  async getDeployments(user: { id: number }): Promise<DeploymentModel[]> {
    const deployments = await this.prismaService.deployment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        repository: true,
        AmplifyConfiguration: true,
        ECSConfiguration: true,
      },
    });

    return PlainToInstance(DeploymentModel, deployments);
  }

  async getDeploymentById(
    id: number,
    user: { id: number },
  ): Promise<DeploymentModel> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        repository: true,
        AmplifyConfiguration: true,
        ECSConfiguration: true,
      },
    });

    if (!deployment) throw new NotFoundException('No deployment found');

    return PlainToInstance(DeploymentModel, deployment);
  }

  async getEnvironmentByDeploymentId(
    id: number,
    user: { id: number },
  ): Promise<EnvironmentModel> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      select: {
        id: true,
        ECSConfiguration: {
          select: {
            environmentId: true,
          },
        },
        AmplifyConfiguration: {
          select: {
            environmentId: true,
          },
        },
      },
    });

    if (!deployment) throw new NotFoundException('No deployment found');

    const environment = await this.prismaService.environment.findFirst({
      where: {
        id:
          deployment.AmplifyConfiguration?.environmentId ||
          deployment.ECSConfiguration?.environmentId,
      },
    });

    return PlainToInstance(EnvironmentModel, environment);
  }

  async updateEnvironmentByDeploymentId(
    dto: UpdateEnvironmentDto,
    user: { id: number },
  ): Promise<EnvironmentModel> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: dto.id,
        userId: user.id,
      },
      select: {
        id: true,
        ECSConfiguration: {
          select: {
            environmentId: true,
          },
        },
        AmplifyConfiguration: {
          select: {
            environmentId: true,
            appId: true,
            productionBranch: true,
          },
        },
      },
    });

    if (!deployment) throw new NotFoundException('No deployment found');

    const environment = await this.prismaService.environment.update({
      where: {
        id:
          deployment.AmplifyConfiguration?.environmentId ||
          deployment.ECSConfiguration?.environmentId,
      },
      data: {
        envVars: dto.envVars,
      },
    });

    return PlainToInstance(EnvironmentModel, environment);
  }

  async getLogsByDeploymentId(
    id: number,
    user: { id: number },
  ): Promise<EnvironmentModel> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      select: {
        id: true,
        ECSConfiguration: {
          select: {
            environmentId: true,
          },
        },
        AmplifyConfiguration: {
          select: {
            appId: true,
          },
        },
      },
    });

    if (!deployment) throw new NotFoundException('No deployment found');

    if (deployment.AmplifyConfiguration) {
      await this.frontendService.getDeploymentLogs(
        deployment.AmplifyConfiguration.appId,
      );
    }

    return PlainToInstance(EnvironmentModel, null);
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    user: { id: number },
  ): Promise<DeploymentModel> {
    await this.checkSubdomain(dto.subdomain);

    await this.checkProSubscription(user.id);

    const repository = await this.createRepository(
      dto.repositoryName,
      dto.repositoryBranch,
      dto.repositoryUrl,
      dto.repositoryOwner,
      user.id,
    );

    const accessToken = await this.getGithubAccessToken(user.id);

    const deployment = await this.prismaService.deployment.create({
      data: {
        userId: user.id,
        type: dto.type as DeploymentType,
        framework: dto.framework,
        repositoryId: repository.id,
        status: DeploymentStatus.PENDING,
        name: dto.name,
      },
    });

    const environment = await this.createEnvironment(dto.envVars);

    let status = DeploymentStatus.SUCCESS as string;

    try {
      if (dto.type === DeploymentType.FRONTEND)
        await this.frontendService.createNewDeployment(
          dto,
          repository,
          accessToken,
          deployment.id,
          environment.id,
          user.id,
        );
      else if (dto.type === DeploymentType.BACKEND) {
        await this.backendService.createNewDeployment(
          dto,
          repository,
          accessToken,
          deployment.id,
          environment.id,
        );

        status = DeploymentStatus.PENDING as string;
      }
    } catch (error) {
      console.log(error);
      status = DeploymentStatus.FAILURE;
    } finally {
      const result = await this.prismaService.deployment.update({
        where: {
          id: deployment.id,
        },
        data: {
          status: status as DeploymentStatus,
        },
        include: {
          repository: true,
          ECSConfiguration: true,
          AmplifyConfiguration: true,
        },
      });

      return PlainToInstance(DeploymentModel, result);
    }
  }

  async deleteDeploymenByDeploymentId(
    id: number,
    user: { id: number },
  ): Promise<DeploymentModel> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!deployment) throw new NotFoundException('No deployment found');

    try {
      if (deployment.type === DeploymentType.FRONTEND)
        await this.frontendService.deleteDeployment(deployment.id);
      else if (deployment.type === DeploymentType.BACKEND)
        await this.backendService.deleteDeployment(deployment.id);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Cannot delete deployment, please try again later',
      );
    }

    return PlainToInstance(DeploymentModel, deployment);
  }
}
