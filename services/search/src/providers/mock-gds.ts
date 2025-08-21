import { ulid } from "ulid";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export async function searchMockGds(req: any) {
  await sleep(rand(180, 650));
  if (Math.random() < 0.10) throw new Error("GDS timeout");

  const base = 88 + Math.random() * 20;
  return [
    {
      provider: "MOCK_GDS",
      id: ulid(),
      price: { amount: base + 9.99, currency: "EUR" },
      carrier: "AF",
      segments: [{
        from: req.origin, to: req.destination,
        dep: `${req.dateRange.from}T06:00:00Z`,
        arr: `${req.dateRange.from}T07:40:00Z`,
        flight: "AF100"
      }],
      baggage: { pieces: 0 }
    }
  ];
}
