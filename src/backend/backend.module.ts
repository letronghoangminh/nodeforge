import { Module } from '@nestjs/common';
import { BackendService } from './backend.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import AppConfig from 'src/config/config';
import { OpenaiModule } from 'src/openai/openai.module';
import { GithubModule } from 'src/github/github.module';
import { EcsService } from 'src/aws-services/ecs.service';
import { AlbService } from 'src/aws-services/alb.service';
import { R53Service } from 'src/aws-services/r53.service';
import { SqsService } from 'src/aws-services/sqs.service';
import { DockerService } from 'src/docker/docker.service';
import { Ec2Service } from 'src/aws-services/ec2.service';
import { IamService } from 'src/aws-services/iam.service';

@Module({
  providers: [
    BackendService,
    EcsService,
    AlbService,
    R53Service,
    SqsService,
    DockerService,
    Ec2Service,
    IamService,
  ],
  exports: [BackendService],
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [AppConfig],
      isGlobal: true,
    }),
    OpenaiModule,
    GithubModule,
  ],
})
export class BackendModule {}
