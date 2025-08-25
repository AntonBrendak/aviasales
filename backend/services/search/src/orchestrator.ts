import { withCache } from './cache.js';
import { searchDuffel } from './providers/duffel.js';

type SearchReq = {
  origin: string; destination: string;
  dateRange: { from: string; to: string };
  pax: Array<{ type:'ADT'|'CHD'|'INF'; count:number }>;
  cabin?: 'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST';
  currency?: string;
  departHour?: [number, number];
};

const MAX_RESULTS = Number(process.env.SEARCH_MAX_RESULTS ?? 100);
const TTL_SEC     = Number(process.env.SEARCH_TTL_SEC ?? 30);

export async function searchOffers(req: SearchReq) {
  console.log('[search] request ->', req);
  const cacheKey = `search:duffel:${req.origin}:${req.destination}:${req.dateRange.from}:${req.dateRange.to}:${JSON.stringify(req.pax)}:${req.cabin ?? '-'}:${req.currency ?? 'EUR'}:${req.departHour?.join('-') ?? ''}`;

  return withCache(cacheKey, TTL_SEC, async () => {
    const offers = await searchDuffel(req);

    // сортируем по цене и лимитируем
    offers.sort((a:any,b:any)=> Number(a?.price?.amount ?? 0) - Number(b?.price?.amount ?? 0));
    return { offers: offers.slice(0, MAX_RESULTS), partial: false };
  });
}