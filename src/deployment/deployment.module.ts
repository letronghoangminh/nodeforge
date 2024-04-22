import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { AmplifyModule } from 'src/amplify/amplify.module';
import { GithubModule } from 'src/github/github.module';
import { OpenaiModule } from 'src/openai/openai.module';
import { EcsModule } from 'src/ecs/ecs.module';

@Module({
  controllers: [DeploymentController],
  providers: [DeploymentService],
  imports: [AmplifyModule, GithubModule, OpenaiModule, EcsModule],
})
export class DeploymentModule {}
