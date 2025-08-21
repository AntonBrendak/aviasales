import { withCache } from "./cache.js";
import { normalizeOffer } from "./normalizer.js";
import { searchMockNdc } from "./providers/mock-ndc.js";
import { searchMockGds } from "./providers/mock-gds.js";
import { searchMockOta } from "./providers/mock-ota.js";

type SearchReq = {
  origin: string;
  destination: string;
  dateRange: { from: string; to: string };
  pax: Array<{ type: "ADT" | "CHD" | "INF"; count: number }>;
  cabin?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
};

export async function searchOffers(req: SearchReq) {
  const cacheKey = `search:${req.origin}:${req.destination}:${req.dateRange.from}:${req.dateRange.to}:${JSON.stringify(req.pax)}:${req.cabin ?? "-"}`;
  const ttlSec = Number(process.env.SEARCH_TTL_SEC ?? 30);

  return withCache(cacheKey, ttlSec, async () => {
    const providers = [searchMockNdc, searchMockGds, searchMockOta];
    const settled = await Promise.allSettled(providers.map(p => p(req)));
    const offers = settled
      .filter(s => s.status === "fulfilled")
      .flatMap((s: any) => s.value as any[])
      .map(normalizeOffer);

    return { offers, partial: settled.some(s => s.status === "rejected") };
  });
}
