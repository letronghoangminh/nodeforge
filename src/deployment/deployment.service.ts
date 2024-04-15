import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeploymentDto } from './dto/deployment.dto';
import { DeploymentModel } from './model/deployment.model';
import { AmplifyService } from 'src/amplify/amplify.service';
import {
  DeploymentStatus,
  DeploymentType,
  Repository,
  SubscriptionType,
} from '@prisma/client';
import { PlainToInstance } from 'src/helpers/helpers';
import { GithubService } from 'src/github/github.service';

@Injectable()
export class DeploymentService {
  constructor(
    private prismaService: PrismaService,
    private amplifyService: AmplifyService,
    private githubService: GithubService,
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

  async createNewDeployment(
    dto: CreateDeploymentDto,
    user: { id: number },
  ): Promise<DeploymentModel> {
    await this.checkSubdomain(dto.subdomain);

    await this.checkProSubscription(user.id);

    const repository = await this.createRepository(
      dto.repositoryName,
      dto.repositoryBranch,
      user.id,
    );

    const accessToken = await this.getGithubAccessToken(user.id);

    if (dto.type === DeploymentType.FRONTEND)
      this.amplifyService.createNewDeployment(dto, repository, accessToken);

    const deployment = await this.prismaService.deployment.create({
      data: {
        userId: user.id,
        type: dto.type as DeploymentType,
        framework: dto.framework,
        repositoryId: repository.id,
        status: DeploymentStatus.PENDING,
      },
    });

    return PlainToInstance(DeploymentModel, deployment);
  }
}
