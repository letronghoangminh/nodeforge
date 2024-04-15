import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { AmplifyModule } from 'src/amplify/amplify.module';
import { GithubModule } from 'src/github/github.module';

@Module({
  controllers: [DeploymentController],
  providers: [DeploymentService],
  imports: [AmplifyModule, GithubModule],
})
export class DeploymentModule {}
