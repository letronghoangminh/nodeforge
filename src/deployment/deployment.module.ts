import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { AmplifyModule } from 'src/amplify/amplify.module';
import { GithubModule } from 'src/github/github.module';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  controllers: [DeploymentController],
  providers: [DeploymentService],
  imports: [AmplifyModule, GithubModule, OpenaiModule],
})
export class DeploymentModule {}
