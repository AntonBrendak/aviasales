import supertest from 'supertest';
import { build } from '../../services/pricing/src/app';

let app:any, req:any;
beforeAll(async()=>{ app = await build(); await app.listen({port:0}); req = supertest(`http://localhost:${app.server.address().port}`); });
afterAll(async()=> app?.close());

it('reprice is idempotent', async () => {
  const body = { searchSessionId:'11111111-1111-1111-1111-111111111111', offerId:'OF1', pax:[{type:'ADT',count:1}] };
  const idem = 'test-key-1';
  const r1 = await req.post('/v1/price').set('Idempotency-Key', idem).send(body);
  const r2 = await req.post('/v1/price').set('Idempotency-Key', idem).send(body);
  expect(r1.body.totals.grandTotal.amount).toBe(r2.body.totals.grandTotal.amount);
});