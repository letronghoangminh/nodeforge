import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from '@prisma/client';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class DockerService {
  constructor(private configService: ConfigService) {}

  async buildDockerImage(
    createDeploymentData: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
  ): Promise<string> {
    return `100117910916.dkr.ecr.ap-southeast-1.amazonaws.com/nodeforge-ecs:${createDeploymentData.name}`;
  }
}
