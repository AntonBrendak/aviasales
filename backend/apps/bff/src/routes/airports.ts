// backend/apps/bff/src/routes/airports.ts
import { Router } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lon?: number;
  cityCode?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Ищем airports.min.json по нескольким путям (в dev/monorepo бывает разный CWD)
const candidates = [
  resolve(process.cwd(), '../services/airports/data/airports.min.json'),
  resolve(process.cwd(), 'services/airports/data/airports.min.json'),
  join(__dirname, '../../../../services/airports/data/airports.min.json'),
];

const dataFile = candidates.find(p => existsSync(p));
if (!dataFile) {
  throw new Error(
    `[airports] data file not found. Tried:\n${candidates.map(p => '  - ' + p).join('\n')}`
  );
}

const airports: Airport[] = JSON.parse(readFileSync(dataFile, 'utf8'));
console.log(`[airports] loaded ${airports.length} from ${dataFile}`);

const router = Router();

/**
 * /v1/airports — поиск по код/название/город (для подсказок по аэропортам)
 * q: строка, limit: число (<=200)
 */
router.get('/airports', (req, res) => {
  const qRaw = String(req.query.q ?? '').trim();
  const q = qRaw.toLowerCase();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  if (!q) return res.json({ items: [] });

  const items = airports
    .filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q)
    )
    .slice(0, limit);

  res.json({ items });
});

/**
 * /v1/cities — уникальные города (для автокомплита по городам)
 * q: строка, country?: ISO2, limit: число (<=200)
 */
router.get('/cities', (req, res) => {
  const qRaw = String(req.query.q ?? '').trim().toLowerCase();
  const country = String(req.query.country ?? '').trim().toUpperCase();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const map = new Map<string, { city: string; country: string; cityCode?: string }>();

  for (const a of airports) {
    if (country && a.country.toUpperCase() !== country) continue;

    const matches =
      !qRaw ||
      a.city.toLowerCase().includes(qRaw) ||
      (a.cityCode ?? '').toLowerCase().includes(qRaw) ||
      a.country.toLowerCase().includes(qRaw);

    if (matches) {
      const key = `${a.city}|${a.country}`;
      if (!map.has(key)) map.set(key, { city: a.city, country: a.country, cityCode: a.cityCode });
    }
  }

  const items = Array.from(map.values()).slice(0, limit);
  res.json({ items });
});

export default router;
