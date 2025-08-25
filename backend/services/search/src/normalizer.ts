type ProviderOffer = {
  provider: "MOCK_NDC" | "MOCK_GDS" | "MOCK_OTA";
  id: string;
  price: { amount: number; currency: string };
  carrier: string;
  segments: Array<{ from: string; to: string; dep: string; arr: string; flight: string }>;
  baggage?: { pieces: number; weightKg?: number };
};

export function normalizeOffer(o: ProviderOffer) {
  return {
    uid: `${o.provider}:${o.id}`,
    price: { amount: Math.round(o.price.amount * 100) / 100, currency: o.price.currency },
    carrier: o.carrier,
    segments: o.segments,
    baggage: o.baggage ?? null,
    source: o.provider,
  };
}
