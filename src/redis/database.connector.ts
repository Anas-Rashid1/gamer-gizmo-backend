import {
  InternalServerErrorException,
  NotImplementedException,
} from '@nestjs/common';
import { Redis } from '@upstash/redis';

export class RedisConnector<Redis> {
  private db;
  connect() {
    const redisToken = process.env.REDIS_TOKEN;
    if (!redisToken) {
      throw new InternalServerErrorException(
        'Could not connect to redis database.',
      );
    }
    const redis = new Redis({
      url: process.env.REDIS_URL,
      token: redisToken,
    });
    this.db = redis;

    return redis;
  }

  query(): Redis {
    if (!this.db) {
      throw new InternalServerErrorException(`Connect Db First!`);
    }
    return this.db;
  }
  disconnect() {
    throw new NotImplementedException();
  }
}
