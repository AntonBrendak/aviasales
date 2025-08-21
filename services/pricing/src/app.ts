import Fastify from 'fastify';
import router from './http/router';

export async function build() {
  const app = Fastify({ logger: true });
  app.get('/health', async () => ({ ok: true, service: 'pricing' }));
  await app.register(router);
  return app;
}