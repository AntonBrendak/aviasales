import { Router } from "express";
import { z } from "zod";
import { searchOffers } from "../../../../services/search/src/orchestrator.js";
import type { components } from "../../../../packages/contracts/types/bff";

type SearchRequest = components["schemas"]["SearchRequest"];
type SearchResponse = components["schemas"]["SearchResponse"];

const router = Router();

const PaxSchema = z.object({
  type: z.enum(["ADT", "CHD", "INF"]),
  count: z.number().int().min(1).max(9),
});
const SearchRequestSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  pax: z.array(PaxSchema).min(1).max(3),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
});

router.post("/search", async (req, res) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: { message: "Invalid request", issues: parsed.error.issues } });

  const data = await searchOffers(parsed.data as SearchRequest);
  res.json(data satisfies SearchResponse);
});

export default router;
