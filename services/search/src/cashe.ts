import Redis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(url, { lazyConnect: true });

export async function withCache<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  await ensure();
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fn();
  await redis.set(key, JSON.stringify(fresh), "EX", ttlSec);
  return fresh;
}

let connected = false;
async function ensure() {
  if (!connected) {
    try {
      await redis.connect();
      connected = true;
    } catch {
      // Если Redis недоступен — не падаем, работаем без кэша.
      connected = false;
    }
  }
}