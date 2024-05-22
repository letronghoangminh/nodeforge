import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from '@prisma/client';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class DockerService {
  constructor(private configService: ConfigService) {}

  buildDockerImage(
    createDeploymentData: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
    dockerfile: string,
  ): string {
    this.createWorkSpace(createDeploymentData);
    this.cloneRepository(createDeploymentData, repository, accessToken);
    this.buildImage(createDeploymentData, repository, dockerfile);
    this.tagImage(createDeploymentData);
    this.getRepositoryToken();
    this.pushImage(createDeploymentData);

    return `${this.configService.get('aws.ecr.repository')}:${
      createDeploymentData.name
    }`;
  }

  private createWorkSpace(createDeploymentData: CreateDeploymentDto) {
    rmSync(`/tmp/${createDeploymentData.name}`, {
      recursive: true,
      force: true,
    });
    mkdirSync(`/tmp/${createDeploymentData.name}`);
  }

  private cloneRepository(
    createDeploymentData: CreateDeploymentDto,
    repository: Repository,
    accessToken: string,
  ) {
    execSync(
      `cd /tmp/${createDeploymentData.name} && git clone https://${accessToken}@github.com/${repository.owner}/${repository.name}`,
    );
    execSync(
      `cd /tmp/${createDeploymentData.name}/${repository.name} && git checkout ${repository.branch}`,
    );
  }

  private buildImage(
    createDeploymentData: CreateDeploymentDto,
    repository: Repository,
    dockerfile: string,
  ) {
    writeFileSync(
      `/tmp/${createDeploymentData.name}/${repository.name}/${createDeploymentData.name}.Dockerfile`,
      dockerfile,
    );
    execSync(
      `docker buildx build --platform linux/amd64 -t ${createDeploymentData.name} /tmp/${createDeploymentData.name}/${repository.name} -f /tmp/${createDeploymentData.name}/${repository.name}/${createDeploymentData.name}.Dockerfile`,
    );
  }

  private tagImage(createDeploymentData: CreateDeploymentDto) {
    execSync(
      `docker tag ${createDeploymentData.name} ${this.configService.get(
        'aws.ecr.repository',
      )}:${createDeploymentData.name}`,
    );
  }

  private getRepositoryToken() {
    execSync(
      `aws ecr get-login-password --region ${this.configService.get(
        'aws.region',
      )} | docker login --username AWS --password-stdin ${this.configService.get(
        'aws.ecr.endpoint',
      )}`,
    );
  }

  private pushImage(createDeploymentData: CreateDeploymentDto) {
    execSync(
      `docker push ${this.configService.get('aws.ecr.repository')}:${
        createDeploymentData.name
      }`,
    );
  }
}
