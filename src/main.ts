import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createSwaggerConfiguration } from 'nestjs-backend-common';

import { appConfigs, AppModule } from './app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { PORT, SERVICE_NAME, SWAGGER_PATH } = app.get<
    ConfigType<typeof appConfigs>
  >(appConfigs.KEY);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      errorHttpStatusCode: 400,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );

  createSwaggerConfiguration({
    app,
    appUrl: `http://localhost:${PORT}/`,
    title: SERVICE_NAME,
    swaggerPath: SWAGGER_PATH,
    description: `${SERVICE_NAME} RESTful API.`,
  });

  await app.listen(PORT, '0.0.0.0');
}

void bootstrap();
