import { FastifyInstance } from 'fastify';
import { PriceRequestSchema } from './schemas';
import { cache, idemKey, repriceKey } from '../adapters/cache.redis';
import { PricingService } from '../domain/pricing.service';
import { CurrencyService } from '../domain/currency.service';
import { FeesService } from '../domain/fees.service';
import { BrandsService } from '../domain/brands.service';
import { SearchDAO } from '../adapters/search.dao.mock';

export default async function router(app: FastifyInstance) {
  app.post('/v1/price', async (req, reply) => {
    const body = PriceRequestSchema.parse(req.body);
    const idem = String(req.headers['idempotency-key'] || '');
    if (idem) {
      const cached = await cache.get(idemKey(idem));
      if (cached) return reply.send(cached);
    }
    const offer = await SearchDAO.getOffer(body.searchSessionId, body.offerId);
    const targetCurrency = body.currency || offer.price.base.currency;

    const svc = new PricingService(
      new CurrencyService('mock'),
      new FeesService(),
      new BrandsService()
    );
    const res = await svc.reprice({ offer, req: body, targetCurrency });

    if (idem) await cache.setex(idemKey(idem), 600, res);
    const hash = `${body.searchSessionId}:${body.offerId}:${targetCurrency}:${JSON.stringify(body.pax)}:${JSON.stringify(body.includeAncillaries||[])}`;
    await cache.setex(repriceKey(hash), 120, res);

    return reply.send(res);
  });
}