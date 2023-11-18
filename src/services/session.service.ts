/* eslint-disable prettier/prettier */
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class SessionService {

  constructor( @InjectRedis() private readonly redisClient: Redis) {
    
  }

  async setSession(key: string, value: any, ttl?: number): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value));
    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async getSession(key: string): Promise<any> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
