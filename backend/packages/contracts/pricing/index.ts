// минимальные типы для Phase 3
export type Money = { amount: string; currency: string };
export type PaxType = 'ADT'|'CHD'|'INF';

export interface PriceRequest {
  searchSessionId: string;
  offerId: string;
  pax: Array<{ type: PaxType; count: number }>;
  currency?: string;
  paymentMethod?: 'card_3ds'|'sepa'|'wallet';
  includeAncillaries?: Array<{ code: string; quantity?: number }>;
}

export interface PriceBreakdownLine {
  code: 'BASE'|'TAX'|'YQ'|'YR'|'SVC'|'PMF'|`ANC-${string}`;
  title: string;
  total: Money;
}

export interface PriceResponse {
  offerId: string;
  brand: 'BASIC'|'STANDARD'|'FLEX';
  currency: string;
  totals: {
    base: Money;
    taxes: Money;
    fees: Money;
    ancillaries: Money;
    grandTotal: Money;
  };
  breakdown: PriceBreakdownLine[];
  fareRulesRef?: string;
  pricedAt: string;
  cacheTtlSec: number;
}
