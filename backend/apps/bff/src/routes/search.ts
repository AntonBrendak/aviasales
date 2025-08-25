import { Router } from 'express';
import { z } from 'zod';
import { searchOffers } from '../../../../services/search/src/orchestrator.js';
import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ---- загрузка справочника аэропортов ----
const candidates = [
  resolve(process.cwd(), '../services/airports/data/airports.min.json'),
  join(__dirname, '../../../../services/airports/data/airports.min.json'),
];

let AIRPORTS: Array<{ code:string; city:string; country:string; cityCode?:string }> = [];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    AIRPORTS = JSON.parse(fs.readFileSync(p, 'utf-8'));
    console.log('[search] loaded airports', AIRPORTS.length, 'from', p);
    break;
  }
}
if (!AIRPORTS.length) {
  console.warn('[search] WARN: airports dataset not found — city → airport mapping will fail');
}

// ---- схемы валидации ----
const PaxSchema = z.object({
  type: z.enum(['ADT','CHD','INF']),
  count: z.number().int().min(1).max(9),
});

const CitySchema = z.object({
  city: z.string().min(1),
  country: z.string().optional(),
  cityCode: z.string().length(3).optional(), // PAR/LON/ROM или конкретный аэропорт (CDG/CIA и т.п.)
  label: z.string().optional(),
});

const DateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const CabinEnum = z.enum(['ANY','ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST']);

const SearchByCitySchema = z.object({
  originCity: CitySchema,
  destinationCity: CitySchema,
  dateRange: DateRangeSchema,
  cabin: CabinEnum.optional(),
  pax: z.array(PaxSchema).min(1).max(3),
  currency: z.string().optional(),
});

const SearchByAirportSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  dateRange: DateRangeSchema,
  cabin: CabinEnum.optional(),
  pax: z.array(PaxSchema).min(1).max(3),
  currency: z.string().optional(),
});

const SearchInputUnion = z.union([SearchByCitySchema, SearchByAirportSchema]);

// ---- утилиты ----
function airportCodesForCity(c: z.infer<typeof CitySchema>) {
  const cityLc = (c.city ?? '').toLowerCase();
  const code   = (c.cityCode ?? '').toUpperCase();
  const list = AIRPORTS
    .filter(a =>
      (a.city && a.city.toLowerCase() === cityLc) ||
      (code && a.cityCode && a.cityCode.toUpperCase() === code) ||
      (code && a.code.toUpperCase() === code)
    )
    .map(a => a.code.toUpperCase());
  return Array.from(new Set(list));
}

const up = (s?: string) => (s ?? '').trim().toUpperCase();

function normalizeFromRaw(body: any) {
  // Приводим «сырой» фронтовый формат к airport-формату, если прилетел не по схеме
  const origin = up(body.origin ?? body.originCity?.cityCode ?? body.originCity?.city);
  const destination = up(body.destination ?? body.destinationCity?.cityCode ?? body.destinationCity?.city);
  const from = body?.dateRange?.from ?? body?.departDate;
  const to   = body?.dateRange?.to   ?? body?.returnDate ?? from;

  const pax = Array.isArray(body.pax)
    ? body.pax
    : [
        { type: 'ADT', count: Math.max(1, Number(body?.pax?.adults ?? 1)) },
        ...(Number(body?.pax?.children ?? 0) ? [{ type: 'CHD', count: Number(body.pax.children) }] : []),
        ...(Number(body?.pax?.infants ?? 0)  ? [{ type: 'INF', count: Number(body.pax.infants) }]  : []),
      ];

  const cabinRaw = up(body?.cabin);
  const cabin = ['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST'].includes(cabinRaw) ? cabinRaw : 'ANY';

  return {
    origin, destination,
    dateRange: { from, to },
    pax,
    cabin,
    currency: body?.currency ?? 'EUR',
  };
}

// ---- маршрут ----
const router = Router();

router.post('/search', async (req, res) => {
  try {
    // 1) сначала пытаемся распарсить то, что прислал фронт, ЛЮБОЙ из двух схем
    const parsedRaw = SearchInputUnion.safeParse(req.body);

    let queryForProvider: z.infer<typeof SearchByAirportSchema>; // то, что пойдёт в orchestrator

    if (parsedRaw.success) {
      // ветка зависит от того, какая альтернатива сматчилась
      if ('originCity' in parsedRaw.data) {
        // ---- режим "по городам" ----
        const { originCity, destinationCity, dateRange, pax } = parsedRaw.data;
        const cabin = parsedRaw.data.cabin && parsedRaw.data.cabin !== 'ANY' ? parsedRaw.data.cabin : undefined;
        const currency = parsedRaw.data.currency ?? 'EUR';

        const origins = airportCodesForCity(originCity);
        const dests   = airportCodesForCity(destinationCity);
        if (!origins.length || !dests.length) {
          return res.status(400).json({ error: { message: 'No airports found for given cities' } });
        }

        // MVP: берём первый код; позже можно сделать fan-out/agg по всем
        queryForProvider = {
          origin: origins[0],
          destination: dests[0],
          dateRange,
          pax,
          cabin,
          currency,
        };
      } else {
        // ---- режим "по IATA" (городской или аэропортный код) ----
        const tmp = parsedRaw.data;
        queryForProvider = {
          origin: up(tmp.origin),
          destination: up(tmp.destination),
          dateRange: tmp.dateRange,
          pax: tmp.pax,
          cabin: tmp.cabin && tmp.cabin !== 'ANY' ? tmp.cabin : undefined,
          currency: tmp.currency ?? 'EUR',
        };
      }
    } else {
      // 2) если совсем «сырой» формат — нормализуем и валидируем схемой аэропортов
      const normalized = normalizeFromRaw(req.body);
      const parsedFallback = SearchByAirportSchema.safeParse(normalized);
      if (!parsedFallback.success) {
        return res.status(400).json({ error: { message: 'Invalid request', issues: parsedFallback.error.issues } });
      }
      queryForProvider = {
        ...parsedFallback.data,
        cabin: parsedFallback.data.cabin && parsedFallback.data.cabin !== 'ANY' ? parsedFallback.data.cabin : undefined,
      };
    }

    console.log('[search] final query ->', queryForProvider);

    // 3) выполняем поиск
    const data = await searchOffers(queryForProvider as any);
    return res.json(data);
  } catch (e: any) {
    console.error('[search] fatal', e);
    return res.status(500).json({ error: { message: e?.message ?? 'Internal error' } });
  }
});

export default router;