import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Repository } from '@prisma/client';
import { AmplifyService } from 'src/aws-services/amplify.service';
import axios from 'axios';

@Injectable()
export class FrontendService {
  constructor(
    private prismaService: PrismaService,
    private amplifyService: AmplifyService,
  ) {}

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    deploymentId: number,
    environmentId: number,
    userId: number,
  ): Promise<void> {
    const createAppInput = await this.amplifyService.buildCreateAppInput(
      dto,
      repository,
      accessToken,
      userId,
    );
    const appData = await this.amplifyService.createAmplifyApp(createAppInput);

    const createBranchInput = this.amplifyService.buildCreateBranchInput(
      dto,
      appData.app.appId,
    );
    await this.amplifyService.createAmplifyBranch(createBranchInput);

    const startDeploymentInput = this.amplifyService.buildStartDeploymentInput(
      dto.repositoryBranch,
      appData.app.appId,
    );
    await this.amplifyService.startDeployment(startDeploymentInput);

    const createDomainAssociationInput =
      this.amplifyService.buildCreateDomainAssociationInput(
        dto,
        appData.app.appId,
      );
    await this.amplifyService.createDomainAssociation(
      createDomainAssociationInput,
    );

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

  async deleteDeployment(deploymentId: number): Promise<void> {
    const deployment = await this.prismaService.deployment.findFirst({
      where: {
        id: deploymentId,
      },
      include: {
        AmplifyConfiguration: {
          select: {
            environmentId: true,
            appId: true,
          },
        },
      },
    });

    if (deployment?.AmplifyConfiguration?.appId) {
      const deleteAppInput = {
        appId: deployment.AmplifyConfiguration.appId,
      };
      await this.amplifyService.deleteApp(deleteAppInput);

      await this.prismaService.amplifyConfiguration.delete({
        where: {
          appId: deployment.AmplifyConfiguration.appId,
        },
      });
    }

    await this.prismaService.environment.delete({
      where: {
        id: deployment.AmplifyConfiguration.environmentId,
      },
    });

    await this.prismaService.deployment.delete({
      where: {
        id: deployment.id,
      },
    });

    await this.prismaService.repository.delete({
      where: {
        id: deployment.repositoryId,
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
    await this.amplifyService.updateApp(updateAppInput);

    const startDeploymentInput = this.amplifyService.buildStartDeploymentInput(
      branch,
      appId,
    );
    await this.amplifyService.startDeployment(startDeploymentInput);
  }

  async getDeploymentLogs(appId: string) {
    const input = this.amplifyService.buildGetLogsInput(appId);
    const logUrl = (await this.amplifyService.getLogs(input)).logUrl;

    const response = await axios.get(logUrl);
    const data = response.data;

    const logs = [];
    const lines = data.split('\n');

    lines.forEach((line) => {
      const logData = line.split(',');
      if (logData.length <= 1) return;

      const log = {
        timestamp: `${logData[0]} ${logData[1]}`,
        message: `${logData[5]} https://${logData[15]}${logData[7]}`,
      };
      logs.push(log);
    });

    logs.shift();

    return logs;
  }
}
