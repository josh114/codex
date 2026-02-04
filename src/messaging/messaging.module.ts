import { Module } from '@nestjs/common';
import { MessagingGateway } from './messaging.gateway';
import { RedisIoAdapter } from './redis-io.adapter';
import { RedisService } from './redis.service';

@Module({
  providers: [MessagingGateway, RedisIoAdapter, RedisService],
  exports: [RedisIoAdapter],
})
export class MessagingModule {}
