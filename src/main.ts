import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3000;

  app.setGlobalPrefix('/api/v1');
  app.enableCors({ credentials: true });
  app.useLogger(new Logger());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const logger = new Logger('Bootstrap');

  await app.listen(port, async () => {
    const url = await app.getUrl();
    logger.log(`API is running on: ${url}`);
  });
}
bootstrap();
