import fc from 'fast-check';
import { isCurrency, money } from '../types/domain';

describe('domain primitives', () => {
  it('isCurrency only accepts allowed ISO codes', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const ok = ['EUR','USD','UAH','GBP'].includes(s);
        expect(isCurrency(s)).toBe(ok);
      })
    );
  });

  it('money rounds to 2 decimals', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, noDefaultInfinity: true, noNaN: true }), (n) => {
        const m = money(n, 'EUR');
        expect(m.amount).toBeCloseTo(Math.round(n * 100) / 100, 2);
      })
    );
  });
});