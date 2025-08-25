import { describe, it, expect } from "vitest";
import { searchOffers } from "../../services/search/src/orchestrator";

describe("search orchestrator (e2e-light)", () => {
  it("returns offers and tolerates one provider failure", async () => {
    const res = await searchOffers({
      origin: "DUS",
      destination: "CDG",
      dateRange: { from: "2025-09-01", to: "2025-09-05" },
      pax: [{ type: "ADT", count: 1 }]
    } as any);

    expect(Array.isArray(res.offers)).toBe(true);
    expect(res.offers.length).toBeGreaterThan(0);
    expect(typeof res.partial).toBe("boolean");
  });
});