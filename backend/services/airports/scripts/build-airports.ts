/* eslint-disable no-console */
import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { URL } from 'node:url';

const DEFAULTS = [
  process.env.AIRPORTS_CSV_URL,                                      // 1) явный URL из env
  'https://ourairports.com/airports.csv',                             // 2) основной CSV
  'https://davidmegginson.github.io/ourairports-data/airports.csv',   // 3) GitHub Pages mirror
  'https://github.com/contrailcirrus/ourairports-data/raw/main/airports.csv', // 4) ещё один mirror
].filter(Boolean) as string[];

const CSV_FILE = process.env.AIRPORTS_CSV_FILE || ''; // локальный путь (если задан)

type OARecord = {
  iata_code: string;
  type: string;
  name: string;
  municipality: string;
  iso_country: string;
  latitude_deg: string;
  longitude_deg: string;
};

type Airport = {
  code: string;
  name: string;
  city: string;
  country: string; // ISO-2
  lat?: number;
  lon?: number;
  cityCode?: string;
};

const outFile = path.join(process.cwd(), 'backend/services/airports/data/airports.min.json');

function toNum(s: string): number | undefined {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function fetchWithRedirects(raw: string, insecure = false, maxHops = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    const hop = (urlStr: string, left: number) => {
      if (left <= 0) return reject(new Error('Too many redirects'));
      const u = new URL(urlStr);
      const req = https.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + (u.search || ''),
          method: 'GET',
          headers: {
            'User-Agent': 'aviasales-frontend-airports-fetch/1.0',
            'Accept': 'text/csv, text/plain, */*',
          },
          rejectUnauthorized: !insecure,
        },
        (res) => {
          const code = res.statusCode ?? 0;
          const loc = res.headers.location as string | undefined;
          if (code >= 300 && code < 400 && loc) {
            // follow redirect
            const next = new URL(loc, u).toString();
            res.resume(); // drain
            return hop(next, left - 1);
          }
          if (code >= 400) {
            res.resume();
            return reject(new Error(`HTTP ${code}`));
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve(body));
        }
      );
      req.on('error', reject);
      req.end();
    };
    hop(raw, maxHops);
  });
}

(async () => {
  let csv = '';

  // 1) локальный файл — если задан и существует
  if (CSV_FILE && fs.existsSync(CSV_FILE)) {
    console.log('[airports] using local CSV:', CSV_FILE);
    csv = fs.readFileSync(CSV_FILE, 'utf8');
  } else {
    // 2) пробуем по списку URL с редиректами и норм UA
    const insecure = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';
    let lastErr: unknown = null;
    for (const url of DEFAULTS) {
      try {
        console.log(`[airports] downloading CSV… ${url} (insecure=${insecure})`);
        csv = await fetchWithRedirects(url, insecure);
        // грубая проверка, что это не HTML
        if (/<!DOCTYPE\s+html/i.test(csv) || /<html/i.test(csv)) {
          throw new Error('HTML returned instead of CSV');
        }
        break;
      } catch (e) {
        console.warn('[airports] failed:', e);
        lastErr = e;
      }
    }
    if (!csv) {
      console.error('[airports] all sources failed');
      throw lastErr ?? new Error('No CSV');
    }
  }

  console.log('[airports] parsing…');
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as OARecord[];

  const filtered = rows.filter(
    (r) =>
      r.iata_code &&
      (r.type === 'large_airport' || r.type === 'medium_airport' || r.type === 'small_airport')
  );

  const typeWeight: Record<string, number> = { large_airport: 3, medium_airport: 2, small_airport: 1 };
  const byIata = new Map<string, OARecord>();
  for (const r of filtered) {
    const cur = byIata.get(r.iata_code);
    if (!cur || (typeWeight[r.type] ?? 0) > (typeWeight[cur.type] ?? 0)) {
      byIata.set(r.iata_code, r);
    }
  }

  const result: Airport[] = Array.from(byIata.values()).map((r) => ({
    code: r.iata_code.toUpperCase(),
    name: r.name,
    city: r.municipality || '',
    country: r.iso_country,
    lat: toNum(r.latitude_deg),
    lon: toNum(r.longitude_deg),
    cityCode: r.iata_code.toUpperCase(),
  }));

  result.sort((a, b) => a.code.localeCompare(b.code));

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(`[airports] done: ${result.length} IATA → ${outFile}`);
})().catch((e) => {
  console.error('[airports] failed', e);
  process.exit(1);
});
