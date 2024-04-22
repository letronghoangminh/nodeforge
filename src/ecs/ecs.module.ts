import { Module } from '@nestjs/common';
import { EcsService } from './ecs.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import AppConfig from 'src/config/config';
import { OpenaiModule } from 'src/openai/openai.module';
import { GithubModule } from 'src/github/github.module';

@Module({
  providers: [EcsService],
  exports: [EcsService],
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
export class EcsModule {}
