import { ulid } from "ulid";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export async function searchMockOta(req: any) {
  await sleep(rand(80, 240));
  if (Math.random() < 0.15) return [];

  const base = 90 + Math.random() * 18;
  return [
    {
      provider: "MOCK_OTA",
      id: ulid(),
      price: { amount: base + 4.31, currency: "EUR" },
      carrier: "EW",
      segments: [{
        from: req.origin, to: req.destination,
        dep: `${req.dateRange.from}T10:10:00Z`,
        arr: `${req.dateRange.from}T11:55:00Z`,
        flight: "EW222"
      }],
      baggage: { pieces: 1, weightKg: 20 }
    }
  ];
}
