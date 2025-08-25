export type UiSearchForm = {
  origin: string;
  destination: string;
  departDate: string;       // YYYY-MM-DD
  returnDate?: string;      // '' | YYYY-MM-DD
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  pax: { adults: number; children?: number; infants?: number };
};

export type BffSearchRequest = {
  origin: string;
  destination: string;
  dateRange: { from: string; to: string };
  pax: Array<{ type: 'ADT' | 'CHD' | 'INF'; count: number }>;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currency?: string;
};

export function toBffSearchRequest(form: UiSearchForm, opts?: { currency?: string }): BffSearchRequest {
  const origin = String(form.origin || '').trim().toUpperCase();
  const destination = String(form.destination || '').trim().toUpperCase();
  const from = form.departDate;
  const to = form.returnDate && form.returnDate !== '' ? form.returnDate : from; // one-way: to = from
  const adults = Math.max(1, Number(form?.pax?.adults ?? 1));
  const children = Math.max(0, Number(form?.pax?.children ?? 0));
  const infants = Math.max(0, Number(form?.pax?.infants ?? 0));

  return {
    origin,
    destination,
    dateRange: { from, to },
    cabin: form.cabin ?? 'ECONOMY',
    pax: [
      { type: 'ADT', count: adults },
      ...(children ? [{ type: 'CHD', count: children }] : []),
      ...(infants ? [{ type: 'INF', count: infants }] : []),
    ],
    ...(opts?.currency ? { currency: opts.currency } : {}),
  };
}