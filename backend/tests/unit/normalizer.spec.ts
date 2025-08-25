import { describe, it, expect } from "vitest";
import { normalizeOffer } from "../../services/search/src/normalizer";

describe("normalizeOffer", () => {
  it("rounds price to 2 decimals and sets uid", () => {
    const u = normalizeOffer({
      provider: "MOCK_NDC",
      id: "X",
      price: { amount: 100.239, currency: "EUR" },
      carrier: "LH",
      segments: [],
      baggage: { pieces: 1 }
    } as any);
    expect(u.uid).toBe("MOCK_NDC:X");
    expect(u.price.amount).toBe(100.24);
  });
});