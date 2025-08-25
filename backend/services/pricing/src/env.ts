export const env = {
  PORT: Number(process.env.PORT || 7103),
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  FX_PROVIDER: (process.env.FX_PROVIDER || 'mock') as 'mock'|'ecb',
};