import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Repository } from '@prisma/client';
import { AmplifyService } from 'src/aws-services/amplify.service';

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

  async deleteDeployment(appId: string): Promise<void> {
    const deleteAppInput = {
      appId: appId,
    };
    await this.amplifyService.deleteApp(deleteAppInput);

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
    await this.amplifyService.updateApp(updateAppInput);

    const startDeploymentInput = this.amplifyService.buildStartDeploymentInput(
      branch,
      appId,
    );
    await this.amplifyService.startDeployment(startDeploymentInput);
  }

  async getDeploymentLogs(appId: string): Promise<void> {
    const input = this.amplifyService.buildGetLogsInput(appId);
    const logs = await this.amplifyService.getLogs(input);

    console.log(logs.logUrl);
  }
}
