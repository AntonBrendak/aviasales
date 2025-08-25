'use client';
import { useEffect, useRef, useState } from 'react';
import { Form, ListGroup, Spinner } from 'react-bootstrap';

type City = { city: string; country?: string; cityCode?: string; label: string };

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function CityAutocomplete(props: {
  label: string;
  value: City | null;
  onSelect: (v: City | null) => void;
  placeholder?: string;
}) {
  const { label, value, onSelect, placeholder } = props;
  const [query, setQuery] = useState(value?.city ?? '');
  const q = useDebounced(query, 200);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setQuery(value?.city ?? ''); }, [value?.city]);

  useEffect(() => {
    if (!q || q.length < 2) { setItems([]); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        setLoading(true);
        const u = new URL('/api/bff/v1/cities', window.location.origin);
        u.searchParams.set('q', q);
        u.searchParams.set('limit', '50');
        const res = await fetch(u, { signal: ac.signal });
        const json = await res.json();
        const items: City[] = (json.items ?? []).map((c: any) => ({
          city: c.city, country: c.country, cityCode: c.cityCode, label: `${c.city}, ${c.country}`
        }));
        setItems(items);
      } catch { /* ignore */ }
      finally { if (!ac.signal.aborted) setLoading(false); }
    })();

    return () => ac.abort();
  }, [q]);

  return (
    <div style={{ position: 'relative' }}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? 'Город'}
        autoComplete="off"
      />
      {loading && <div className="position-absolute" style={{ right: 8, top: 36 }}><Spinner size="sm" /></div>}
      {open && items.length > 0 && (
        <ListGroup style={{ position: 'absolute', zIndex: 10, width: '100%', maxHeight: 240, overflow: 'auto' }}>
          {items.map((c, i) => (
            <ListGroup.Item
              key={`${c.city}-${c.country}-${i}`}
              action
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(c); setQuery(c.city); setOpen(false); }}
            >
              {c.label}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}