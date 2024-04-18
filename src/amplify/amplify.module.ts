import { Module } from '@nestjs/common';
import { AmplifyService } from './amplify.service';
import { GithubModule } from 'src/github/github.module';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  providers: [AmplifyService],
  exports: [AmplifyService],
  imports: [GithubModule, OpenaiModule],
})
export class AmplifyModule {}
