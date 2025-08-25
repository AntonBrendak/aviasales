export type Filters = {
  carriers: string[];
  maxPrice?: number;
  withBaggage?: boolean;
  departHour?: [number, number];
  cabin?: 'ANY' | 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
};

type Offer = any;

function getCabin(o: Offer): string | undefined {
  return (
    o.cabin ??
    o.fare?.cabin ??
    o.fareClass ??
    o.fareFamily?.cabin ??
    (o.fares && o.fares[0]?.cabin) ??
    undefined
  )?.toString().toUpperCase();
}

export function applyFilters(offers: Offer[], f: Filters): Offer[] {
  const h0 = f.departHour?.[0] ?? 0;
  const h1 = f.departHour?.[1] ?? 23;

  return offers.filter((o) => {
    const amount = o.price?.amount ?? 0;
    if (f.maxPrice != null && amount > f.maxPrice) return false;

    if (f.withBaggage) {
      const pieces = o.baggagePieces ?? o.baggage?.pieces ?? 0;
      if (!pieces || pieces <= 0) return false;
    }

    if (f.carriers?.length) {
      const c = o.carrier || o.slices?.[0]?.carrier || o.segments?.[0]?.carrier;
      if (!c || !f.carriers.includes(c)) return false;
    }

    if (f.cabin && f.cabin !== 'ANY') {
      const oc = getCabin(o);
      if (!oc || oc !== f.cabin) return false;
    }

    const depIso = o.slices?.[0]?.departAt ?? o.segments?.[0]?.dep;
    if (depIso) {
      const hour = new Date(depIso).getHours();
      if (hour < h0 || hour > h1) return false;
    }

    return true;
  });
}
