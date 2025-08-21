import { CurrencyService } from './currency.service';
import { FeesService } from './fees.service';
import { BrandsService } from './brands.service';
import { Money, add, zero, isPositive } from '@packages/lib';
import type { PriceRequest, PriceResponse } from '@contracts/pricing';

const sum = (arr: Money[] = [], ccy: string) => arr.reduce((s,m)=> add(s,m), zero(ccy));

export class PricingService {
  constructor(
    private readonly currency: CurrencyService,
    private readonly fees: FeesService,
    private readonly brands: BrandsService
  ) {}

  async reprice(ctx: {
    offer: any; req: PriceRequest; targetCurrency: string;
  }): Promise<PriceResponse> {
    const target = ctx.targetCurrency;
    const brand = this.brands.resolve(ctx.offer);

    const base = await this.currency.convert(ctx.offer.price.base, target);
    const taxes = await this.currency.convert(sum(ctx.offer.price.taxes, ctx.offer.price.base.currency), target);
    const yqyr  = await this.currency.convert(sum(ctx.offer.price.carrierFees ?? [], ctx.offer.price.base.currency), target);

    const ancOfferCcy = await this.fees.calcAncillaries(ctx.offer, ctx.req.includeAncillaries ?? []);
    const anc = await this.currency.convert(ancOfferCcy, target);
    const svc = this.fees.serviceFee({ brand, pax: ctx.req.pax, currency: target });
    const pmf = this.fees.paymentFee({ method: ctx.req.paymentMethod ?? 'card_3ds', currency: target });

    const fees = [yqyr, svc, pmf].reduce((s,f)=> add(s,f), zero(target));
    const grand = [base, taxes, fees, anc].reduce((s,m)=> add(s,m), zero(target));

    return {
      offerId: ctx.offer.id,
      brand,
      currency: target,
      totals: { base, taxes, fees, ancillaries: anc, grandTotal: grand },
      breakdown: [
        { code:'BASE', title:'Base fare', total: base },
        { code:'TAX',  title:'Taxes',     total: taxes },
        ...(isPositive(yqyr) ? [{ code:'YQ',  title:'Carrier fees', total: yqyr }] : []),
        ...(isPositive(svc)  ? [{ code:'SVC', title:'Service fee',  total: svc  }] : []),
        ...(isPositive(pmf)  ? [{ code:'PMF', title:'Payment fee',  total: pmf  }] : []),
        ...(isPositive(anc)  ? [{ code:'ANC-ALL', title:'Ancillaries', total: anc }] : []),
      ],
      pricedAt: new Date().toISOString(),
      cacheTtlSec: 120
    };
  }
}