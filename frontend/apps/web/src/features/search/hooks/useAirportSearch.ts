'use client';
import { useEffect, useRef, useState } from 'react';

export type Airport = { code: string; city: string; name: string; country?: string };

function normalize(item: any): Airport | null {
  const code = item?.iata || item?.code || item?.iataCode || item?.id;
  const city = item?.city || item?.cityName || item?.municipality || item?.city?.name;
  const name = item?.name || item?.airportName || item?.label;
  const country = item?.country || item?.countryName || item?.iso_country || item?.country?.name;
  if (!code || !city || !name) return null;
  return { code: String(code).toUpperCase(), city: String(city), name: String(name), country };
}

export function useAirportSearch(query: string) {
  const [data, setData] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const q = (query || '').trim();

  useEffect(() => {
    if (!q) { setData([]); setErr(null); return; }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctl = new AbortController(); abortRef.current = ctl;
      setLoading(true); setErr(null);
      try {
        const url = `/api/bff/v1/airports?q=${encodeURIComponent(q)}&limit=10`;
        const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
        const text = await res.text();
        if (!res.ok) throw new Error(text || res.statusText);
        const json = JSON.parse(text || '[]');
        const arr = Array.isArray(json) ? json : (json.items || json.results || []);
        const list = (arr || []).map(normalize).filter(Boolean) as Airport[];
        setData(list);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load airports');
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(t); abortRef.current?.abort(); };
  }, [q]);

  return { data, loading, error: err };
}