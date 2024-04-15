import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AmplifyClient, CreateAppCommand } from '@aws-sdk/client-amplify';
import { Repository } from '@prisma/client';

@Injectable()
export class AmplifyService {
  private client: AmplifyClient;

  constructor(private prismaService: PrismaService) {
    this.client = new AmplifyClient({ region: 'ap-southeast-1' });
  }

  async createNewDeployment(
    dto: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
  ) {
    const input = {
      name: dto.subdomain,
      repository: repository.name,
      platform: 'WEB_COMPUTE',
      accessToken: accessToken,
      enableBranchAutoBuild: true,
      environmentVariables: dto.envVars,
    };

    if (dto.framework === 'NextJS') {
      // TODO: add buildspec for NextJS
    }

    console.log(input);
  }
}
