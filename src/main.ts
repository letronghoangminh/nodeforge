import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RawBodyMiddleware } from './helpers/middlewares';
import { BackendModule } from './backend/backend.module';

async function bootstrap() {
  let appModule: any = AppModule;

  if (process.env.WORKER_ENABLE) appModule = BackendModule;

  const app = await NestFactory.create(appModule);

  app.setGlobalPrefix('api');
  const configService = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NodeForge')
    .setDescription('NodeForge API Documentation')
    .setVersion('1.0')
    .setContact(
      'Minh',
      'https://www.linkedin.com/in/psycholog1st/',
      'letronghoangminh@gmail.com',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(
    `api/${configService.get('swagger.docsUrl')}`,
    app,
    document,
  );

  app.use(RawBodyMiddleware());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(configService.get('app.port'), '0.0.0.0');
}
bootstrap();
