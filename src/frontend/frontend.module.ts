import { Module } from '@nestjs/common';
import { FrontendService } from './frontend.service';
import { GithubModule } from 'src/github/github.module';
import { OpenaiModule } from 'src/openai/openai.module';
import { AmplifyService } from 'src/aws-services/amplify.service';

@Module({
  providers: [FrontendService, AmplifyService],
  exports: [FrontendService],
  imports: [GithubModule, OpenaiModule],
})
export class FrontendModule {}
