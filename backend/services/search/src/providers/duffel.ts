type Pax = { type: 'ADT' | 'CHD' | 'INF'; count: number };

export type SearchReq = {
  origin: string;                     // IATA (аэропорт) — уже после маппинга из городского кода
  destination: string;                // IATA (аэропорт)
  dateRange: { from: string; to: string }; // YYYY-MM-DD
  pax: Pax[];
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currency?: string;
  departHour?: [number, number];      // опциональный фильтр по времени вылета (часы 0..23)
};

const DUF_BASE = process.env.DUFFEL_BASE_URL || 'https://api.duffel.com';
const DUF_VER  = process.env.DUFFEL_VERSION || 'v2';

const SUPPLIER_TIMEOUT_MS = Math.min(
  Math.max(Number(process.env.DUFFEL_SUPPLIER_TIMEOUT_MS ?? 10000), 2000),
  60000
);
const DUFFEL_MAX_CONNECTIONS = Number(process.env.DUFFEL_MAX_CONNECTIONS ?? 1);
const OFFERS_PAGE_LIMIT = Math.min(
  Math.max(Number(process.env.DUFFEL_OFFERS_LIMIT ?? 200), 1),
  200
);

// ---------- utils ----------
function* eachDateISO(from: string, to: string) {
  const s = new Date(from), e = new Date(to);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    yield d.toISOString().slice(0, 10);
  }
}
function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
function toHHMM(h: number) { return `${pad2(h)}:00`; }

function mapCabin(c?: SearchReq['cabin']) {
  if (!c || c === 'ECONOMY') return 'economy';
  if (c === 'PREMIUM_ECONOMY') return 'premium_economy';
  if (c === 'BUSINESS') return 'business';
  if (c === 'FIRST') return 'first';
  return undefined;
}

function buildPassengers(pax: Pax[]) {
  const adt = pax.find(p => p.type === 'ADT')?.count ?? 1;
  const chd = pax.find(p => p.type === 'CHD')?.count ?? 0;
  const inf = pax.find(p => p.type === 'INF')?.count ?? 0;
  return [
    ...Array.from({ length: adt }).map(() => ({ type: 'adult' })),
    ...Array.from({ length: chd }).map(() => ({ type: 'child' })),
    ...Array.from({ length: inf }).map(() => ({ type: 'infant_without_seat' })),
  ];
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[Duffel] ENV ${name} is not set. Put it in .env or export it in the shell.`);
  }
  return v;
}
function maskToken(t: string) {
  if (!t) return 'undefined';
  if (t.length <= 8) return '****';
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

// ---------- Duffel API calls ----------
async function createOfferRequestV2(origin: string, destination: string, departureDate: string, req: SearchReq) {
  const DUF_KEY = requireEnv('DUFFEL_ACCESS_TOKEN'); // fail-fast с понятной ошибкой
  // Логируем маску, а не сам токен
  console.log('[Duffel] using token:', maskToken(DUF_KEY));

  const departure_time =
    req.departHour && Array.isArray(req.departHour)
      ? { from: toHHMM(req.departHour[0]), to: toHHMM(req.departHour[1]) }
      : undefined;

  const body = {
    data: {
      slices: [{ origin, destination, departure_date: departureDate, ...(departure_time ? { departure_time } : {}) }],
      passengers: buildPassengers(req.pax),
      max_connections: DUFFEL_MAX_CONNECTIONS,
      ...(req.cabin ? { cabin_class: mapCabin(req.cabin) } : {}),
    }
  };

  const url = new URL(`${DUF_BASE}/air/offer_requests`);
  url.searchParams.set('return_offers', 'false');
  url.searchParams.set('supplier_timeout', String(SUPPLIER_TIMEOUT_MS));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DUF_KEY}`,
      'Duffel-Version': DUF_VER,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`duffel ORQ ${res.status} ${t}`);
  }
  const j = await res.json();
  return j?.data?.id as string; // orq_...
}

async function listOffersV2(offerRequestId: string, limit = OFFERS_PAGE_LIMIT) {
  const DUF_KEY = requireEnv('DUFFEL_ACCESS_TOKEN');
  const out: any[] = [];
  let after: string | undefined;

  while (true) {
    const url = new URL(`${DUF_BASE}/air/offers`);
    url.searchParams.set('offer_request_id', offerRequestId);
    url.searchParams.set('limit', String(limit));
    if (after) url.searchParams.set('after', after);

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${DUF_KEY}`,
        'Duffel-Version': DUF_VER,
        'Accept': 'application/json',
      }
    });
    if (!res.ok) break;

    const j = await res.json();
    const page = Array.isArray(j?.data) ? j.data : [];
    out.push(...page);

    const next = j?.meta?.after as string | undefined;
    if (!next || page.length === 0) break;
    after = next;
  }
  return out;
}

function normalizeDuffelOffer(o: any, currencyFallback = 'EUR') {
  const slices = o?.slices ?? [];
  const segs = (slices[0]?.segments ?? []).map((s: any) => ({
    from: s?.origin?.iata_code,
    to: s?.destination?.iata_code,
    dep: s?.departing_at,
    arr: s?.arriving_at,
    flight: `${s?.operating_carrier?.iata_code ?? s?.marketing_carrier?.iata_code ?? ''}${s?.operating_carrier_flight_number ?? s?.marketing_carrier_flight_number ?? ''}`,
  }));
  return {
    uid: o?.id,
    price: { amount: Number(o?.total_amount ?? 0), currency: o?.total_currency ?? currencyFallback },
    carrier: o?.owner?.iata_code,
    segments: segs,
    baggage: undefined,
    source: 'DUFFEL',
  };
}

// ---------- public API ----------
export async function searchDuffel(req: SearchReq) {
  const results: any[] = [];
  const seen = new Set<string>();

  for (const dep of eachDateISO(req.dateRange.from, req.dateRange.to)) {
    let orqId: string | null = null;
    try {
      orqId = await createOfferRequestV2(req.origin, req.destination, dep, req);
    } catch (e) {
      console.warn(`[Duffel] ORQ failed for ${req.origin}-${req.destination} ${dep}:`, (e as Error).message);
      continue; // пропускаем дату, не падаем всем поиском
    }
    if (!orqId) continue;

    console.log(`[Duffel] ORQ created: ${orqId} for ${req.origin}-${req.destination} on ${dep}`);

    const offers = await listOffersV2(orqId);
    for (const o of offers) {
      const uid = String(o?.id ?? '');
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      results.push(normalizeDuffelOffer(o, req.currency ?? 'EUR'));
    }
  }

  return results;
}

export async function listOfferRequestsPage(after?: string, before?: string, limit = 50) {
  const DUF_KEY = requireEnv('DUFFEL_ACCESS_TOKEN');
  const url = new URL(`${DUF_BASE}/air/offer_requests`);
  if (after) url.searchParams.set('after', after);
  if (before) url.searchParams.set('before', before);
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 200)));

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${DUF_KEY}`,
      'Duffel-Version': DUF_VER,
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`duffel ORQ list ${res.status}`);
  return res.json(); // { meta, data: [...] }
}
