import { z } from 'zod';

export const PriceRequestSchema = z.object({
  searchSessionId: z.string().uuid(),
  offerId: z.string().min(1),
  pax: z.array(z.object({
    type: z.enum(['ADT','CHD','INF']),
    count: z.number().int().positive()
  })).min(1),
  currency: z.string().length(3).optional(),
  paymentMethod: z.enum(['card_3ds','sepa','wallet']).optional(),
  includeAncillaries: z.array(z.object({
    code: z.string().min(1),
    quantity: z.number().int().positive().optional().default(1)
  })).optional()
});
