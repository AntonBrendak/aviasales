import { Money, make } from '@packages/lib';
import { getFxRate } from '../adapters/fx.mock';

export class CurrencyService {
  constructor(private provider: 'mock'|'ecb'='mock') {}
  async convert(from: Money, to: string): Promise<Money> {
    if (from.currency === to) return from;
    const rate = await getFxRate(from.currency, to);
    return make((+from.amount) * rate, to);
  }
}