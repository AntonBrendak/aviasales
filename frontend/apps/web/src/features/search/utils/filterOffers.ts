export type Filters = {
  carriers: string[];           // выбранные коды перевозчиков
  maxPrice?: number;            // максимум EUR
  withBaggage?: boolean;        // только с багажом
  departHour?: [number, number]; // [from,to] 0..23
};

export type Offer = {
  id: string;
  price: { amount: number; currency: string };
  carrier?: string;
  baggagePieces?: number;
  slices: { departAt: string; carrier?: string }[];
};

export function applyFilters(offers: Offer[], f: Filters): Offer[] {
  return offers.filter((o) => {
    if (f.maxPrice != null && o.price.amount > f.maxPrice) return false;

    const carriers = new Set([
      o.carrier,
      ...o.slices.map(s => s.carrier).filter(Boolean) as string[],
    ]);
    if (f.carriers?.length) {
      const any = f.carriers.some(c => carriers.has(c));
      if (!any) return false;
    }

    if (f.withBaggage && !(o.baggagePieces && o.baggagePieces > 0)) return false;

    if (f.departHour) {
      const [from, to] = f.departHour;
      const h = new Date(o.slices?.[0]?.departAt ?? 0).getHours();
      const inRange = from <= to ? (h >= from && h <= to) : (h >= from || h <= to);
      if (!inRange) return false;
    }

    return true;
  });
}