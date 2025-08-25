import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: () => 1000,
});
redis.on('error', e => console.error('[redis]', e.message));
// в index.ts не await — чтобы не блокировать старт
import { redis } from './lib/redis'; redis.connect().catch(e => console.error('[redis] connect failed', e.message));