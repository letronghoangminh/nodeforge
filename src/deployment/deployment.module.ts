import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { FrontendModule } from 'src/frontend/frontend.module';
import { GithubModule } from 'src/github/github.module';
import { OpenaiModule } from 'src/openai/openai.module';
import { BackendModule } from 'src/backend/backend.module';

@Module({
  controllers: [DeploymentController],
  providers: [DeploymentService],
  imports: [FrontendModule, GithubModule, OpenaiModule, BackendModule],
})
export class DeploymentModule {}
