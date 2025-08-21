import IORedis from 'ioredis';
import { env } from '../env';

const redis = new IORedis(env.REDIS_URL, { lazyConnect: true });
redis.on('error', (e) => console.warn('[redis] error:', e.message));

async function ensure() {
  if ((redis as any).status === 'end' || (redis as any).status === 'wait') {
    try { await redis.connect(); } catch (e) { /* swallow — fallback to no-cache */ }
  }
}

export const cache = {
  async get<T>(key: string): Promise<T|undefined> {
    try { await ensure(); const v = await redis.get(key); return v ? JSON.parse(v) : undefined; }
    catch { return undefined; }
  },
  async setex(key: string, ttlSec: number, val: unknown) {
    try { await ensure(); await redis.setex(key, ttlSec, JSON.stringify(val)); }
    catch { /* no-op if redis unavailable */ }
  }
};

export const idemKey    = (k: string) => `idem:${k}`;
export const repriceKey = (h: string) => `reprice:${h}`;