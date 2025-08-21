import { Money, make, zero } from '@packages/lib';

export class FeesService {
  serviceFee({ brand, pax, currency }:{
    brand:'BASIC'|'STANDARD'|'FLEX',
    pax:Array<{type:string;count:number}>,
    currency:string
  }): Money {
    const perPax = brand==='BASIC' ? 8 : brand==='STANDARD' ? 5 : 0;
    const total = pax.reduce((s,p)=> s + p.count*perPax, 0);
    return total ? make(total, currency) : zero(currency);
  }

  paymentFee({ method, currency }:{
    method:'card_3ds'|'sepa'|'wallet', currency:string
  }): Money {
    const map = { card_3ds: 1.5, sepa: 0.5, wallet: 1.0 };
    return make(map[method] ?? 0, currency);
  }

  async calcAncillaries(
    offer: any,
    req: Array<{code:string;quantity?:number}>
  ): Promise<Money> {
    const ccy = offer.price.base.currency;
    const sum = req.reduce((s,a)=> s + (a.quantity ?? 1) * (offer.ancPrice?.[a.code]?.amount ?? 0), 0);
    return make(sum, ccy);
  }
}