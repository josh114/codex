import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './messaging/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const redisAdapter = app.get(RedisIoAdapter);
  await redisAdapter.connect();
  app.useWebSocketAdapter(redisAdapter);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
