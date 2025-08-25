import { normalizeOffer } from '../normalizer.js';

type SearchReq = {
  origin: string;
  destination: string;
  dateRange: { from: string; to: string };
  pax: Array<{ type: 'ADT'|'CHD'|'INF'; count: number }>;
  cabin?: 'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST';
  currency?: string;
};

const AM_BASE = process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com';
const AM_ID    = process.env.AMADEUS_CLIENT_ID!;
const AM_SEC   = process.env.AMADEUS_CLIENT_SECRET!;

async function getToken() {
  const res = await fetch(`${AM_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type:'client_credentials', client_id: AM_ID, client_secret: AM_SEC }),
  });
  if (!res.ok) throw new Error(`amadeus token ${res.status}`);
  const j = await res.json();
  return j.access_token as string;
}

function* eachDateISO(from: string, to: string) {
  const d = new Date(from), end = new Date(to);
  for (let x = new Date(d); x <= end; x.setDate(x.getDate()+1)) {
    yield x.toISOString().slice(0,10);
  }
}

export async function searchAmadeus(req: SearchReq) {
  const token = await getToken();
  const out:any[] = [];
  for (const dep of eachDateISO(req.dateRange.from, req.dateRange.to)) {
    const url = new URL(`${AM_BASE}/v2/shopping/flight-offers`);
    url.searchParams.set('originLocationCode', req.origin);
    url.searchParams.set('destinationLocationCode', req.destination);
    url.searchParams.set('departureDate', dep);
    url.searchParams.set('adults', String(req.pax.find(p=>p.type==='ADT')?.count ?? 1));
    url.searchParams.set('currencyCode', req.currency ?? 'EUR');
    url.searchParams.set('max', '50');
    if (req.cabin) url.searchParams.set('travelClass', req.cabin); // ECONOMY/BUSINESS/...

    const res = await fetch(url, { headers: { Authorization:`Bearer ${token}` } });
    if (!res.ok) continue; // мягко игнорим даты без данных
    const j = await res.json();
    const list = Array.isArray(j?.data) ? j.data : [];
    for (const o of list) {
      // нормализация Amadeus → наш оффер
      const it = o?.itineraries?.[0];
      const segs = (it?.segments ?? []).map((s:any) => ({
        from: s?.departure?.iataCode,
        to:   s?.arrival?.iataCode,
        dep:  s?.departure?.at,
        arr:  s?.arrival?.at,
        flight: `${s?.carrierCode ?? ''}${s?.number ?? ''}`
      }));
      out.push(normalizeOffer({
        uid: o?.id,
        price: { amount: Number(o?.price?.grandTotal ?? o?.price?.total ?? 0), currency: o?.price?.currency ?? 'EUR' },
        carrier: o?.validatingAirlineCodes?.[0],
        segments: segs,
        baggage: undefined,
        source: 'AMADEUS',
      }));
    }
  }
  return out;
}