import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import AppConfig from './config/config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { GithubModule } from './github/github.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { DeploymentModule } from './deployment/deployment.module';
import { OpenaiModule } from './openai/openai.module';
import { AmplifyModule } from './amplify/amplify.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [AppConfig],
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    MailModule,
    GithubModule,
    SubscriptionModule,
    DeploymentModule,
    OpenaiModule,
    AmplifyModule,
  ],
})
export class AppModule {}
