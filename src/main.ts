import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { isProd } from './common/utils';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  app.setGlobalPrefix('api');

  app.useWebSocketAdapter(new IoAdapter(app));

  const frontendUrl = config.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', frontendUrl],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  if (!isProd()) {
    setupSwagger(app);
  }

  await app.listen(config.get<number>('port')!);
}
bootstrap();
