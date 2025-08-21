import { build } from './app';
import { env } from './env';

build().then(app => {
  app.listen({ host: '0.0.0.0', port: env.PORT })
    .then(addr => app.log.info({ addr }, 'pricing up'))
    .catch(err => { app.log.error(err); process.exit(1); });
});