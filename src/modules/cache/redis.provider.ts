import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RedisClient = Redis;

export const redisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService): RedisClient => {
    return new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
    });
  },
  inject: [ConfigService],
};
