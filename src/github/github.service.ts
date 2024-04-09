import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AuthorizeUrlModel,
  GithubBranchModel,
  GithubProfileModel,
  GithubRepositoryModel,
} from './model/github.model';
import { ConfigService } from '@nestjs/config';
import { GetGithubBranchesDto, SaveGithubProfileDto } from './dto/github.dto';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { PlainToInstance } from 'src/helpers/helpers';
import { MessageModel } from 'src/helpers/model';

@Injectable()
export class GithubService {
  private githubApp: Octokit;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.githubApp = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: configService.get('githubApp.id'),
        privateKey: configService.get('githubApp.privateKey'),
      },
    });
  }

  private async createInstallationAccessToken(
    installationId: number,
  ): Promise<string> {
    const accessToken = await this.githubApp.apps.createInstallationAccessToken(
      {
        installation_id: installationId,
      },
    );

    return accessToken.data.token;
  }

  private async createInstallationAuth(
    installationId: number,
  ): Promise<Octokit> {
    const accessToken = await this.createInstallationAccessToken(
      installationId,
    );

    const githubRestClient = new Octokit({
      auth: accessToken,
    });

    return githubRestClient;
  }

  async getAuthorizeUrl(): Promise<AuthorizeUrlModel> {
    return {
      url: `https://github.com/apps/${this.configService.get(
        'githubApp.name',
      )}/installations/new`,
    };
  }

  async saveGithubProfile(
    dto: SaveGithubProfileDto,
    user: {
      role: string;
      username: string;
      id: number;
    },
  ): Promise<GithubProfileModel> {
    try {
      const installation = await this.githubApp.apps.getInstallation({
        installation_id: dto.installationId,
      });

      if (installation.status != HttpStatus.OK)
        throw new NotFoundException('Installation not found');

      const githubProfile = this.prismaService.githubProfile.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          installationId: dto.installationId,
        },
        update: {
          installationId: dto.installationId,
        },
      });

      return PlainToInstance(GithubProfileModel, githubProfile);
    } catch (err) {
      throw new NotFoundException(
        err?.response?.message || 'Installation not found',
      );
    }
  }

  async deleteGithubProfile(user: {
    role: string;
    username: string;
    id: number;
  }): Promise<MessageModel> {
    try {
      const githubProfile = await this.prismaService.githubProfile.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!githubProfile) throw new NotFoundException('Installation not found');

      await this.githubApp.apps.deleteInstallation({
        installation_id: githubProfile.installationId,
      });

      await this.prismaService.githubProfile.delete({
        where: {
          userId: user.id,
        },
      });

      return PlainToInstance(MessageModel, {
        message: 'Github profile deleted',
      });
    } catch (err) {
      throw new BadRequestException(
        err?.response?.message ||
          'Installation deletion is not completed, please try again or try to manually uninstall the app from Github',
      );
    }
  }

  async getGithubRepositories(user: {
    id: number;
  }): Promise<GithubRepositoryModel[]> {
    try {
      const githubProfile = await this.prismaService.githubProfile.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!githubProfile) throw new NotFoundException('Installation not found');

      const githubRestClient = await this.createInstallationAuth(
        githubProfile.installationId,
      );

      const response =
        await githubRestClient.apps.listReposAccessibleToInstallation();

      if (response.status !== HttpStatus.OK)
        throw new BadRequestException('Cannot list repositories');

      const repositories: GithubRepositoryModel[] = [];

      response.data.repositories.forEach((repository) => {
        repositories.push({
          name: repository.name,
          fullName: repository.full_name,
          url: repository.url,
          ownerName: repository.owner.login,
        });
      });

      return repositories;
    } catch (err) {
      console.log(err);
      throw new BadRequestException(
        err?.response?.message || 'Access denied for this installation',
      );
    }
  }

  async getGithubBranches(
    query: GetGithubBranchesDto,
    user: {
      id: number;
    },
  ): Promise<GithubBranchModel[]> {
    try {
      const githubProfile = await this.prismaService.githubProfile.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!githubProfile) throw new NotFoundException('Installation not found');

      const githubRestClient = await this.createInstallationAuth(
        githubProfile.installationId,
      );

      const response = await githubRestClient.repos.listBranches({
        owner: query.owner,
        repo: query.repository,
      });

      if (response.status !== HttpStatus.OK)
        throw new BadRequestException('Cannot list branches');

      const branches: GithubBranchModel[] = [];

      response.data.forEach((branch) => {
        branches.push({
          name: branch.name,
        });
      });

      return branches;
    } catch (err) {
      console.log(err);
      throw new BadRequestException(
        err?.response?.message || 'Access denied for this installation',
      );
    }
  }
}
