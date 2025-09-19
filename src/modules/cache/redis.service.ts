import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { isDev } from 'src/common/utils';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  private readonly isCacheEnabled: boolean;
  private readonly client: RedisClient;
  private readonly ttlDefault: number;

  constructor(
    @Inject('REDIS_CLIENT') client: unknown,
    private readonly configService: ConfigService,
  ) {
    this.client = client as RedisClient;
    this.isCacheEnabled = !isDev();
    this.ttlDefault = this.configService.get<number>('redis.ttl')!;
  }

  async set(key: string, value: string, ttl?: number) {
    if (!this.isCacheEnabled) return;
    await this.client.set(key, value, 'EX', ttl ?? this.ttlDefault);
  }

  async get(key: string): Promise<string | null> {
    if (!this.isCacheEnabled) return null;
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    if (!this.isCacheEnabled) return 0;
    return await this.client.del(key);
  }
}
