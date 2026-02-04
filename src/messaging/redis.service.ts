import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.client = createClient({ url });
    this.client.connect();
  }

  async addSocket(userId: string, socketId: string): Promise<void> {
    await this.client.sAdd(this.userKey(userId), socketId);
  }

  async removeSocket(userId: string, socketId: string): Promise<void> {
    await this.client.sRem(this.userKey(userId), socketId);
  }

  async getSockets(userId: string): Promise<string[]> {
    return this.client.sMembers(this.userKey(userId));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private userKey(userId: string): string {
    return `user:${userId}:sockets`;
  }
}
