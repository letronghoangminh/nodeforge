import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import AppConfig from './config/config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';

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
  ],
})
export class AppModule {}
