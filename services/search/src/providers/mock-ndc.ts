import { ulid } from "ulid";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export async function searchMockNdc(req: any) {
  await sleep(rand(120, 420));
  if (Math.random() < 0.05) throw new Error("NDC upstream 5xx");

  const base = 97 + Math.random() * 23;
  return [
    {
      provider: "MOCK_NDC",
      id: ulid(),
      price: { amount: base, currency: "EUR" },
      carrier: "LH",
      segments: [{
        from: req.origin, to: req.destination,
        dep: `${req.dateRange.from}T07:20:00Z`,
        arr: `${req.dateRange.from}T09:00:00Z`,
        flight: "LH1001"
      }],
      baggage: { pieces: 1, weightKg: 23 }
    },
    {
      provider: "MOCK_NDC",
      id: ulid(),
      price: { amount: base + 14.49, currency: "EUR" },
      carrier: "LH",
      segments: [{
        from: req.origin, to: req.destination,
        dep: `${req.dateRange.from}T12:05:00Z`,
        arr: `${req.dateRange.from}T13:45:00Z`,
        flight: "LH1013"
      }],
      baggage: { pieces: 1, weightKg: 23 }
    }
  ];
}
