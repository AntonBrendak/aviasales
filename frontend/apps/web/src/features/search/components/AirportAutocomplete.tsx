'use client';
import { useEffect, useRef, useState } from 'react';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import { useAirportSearch, type Airport } from '@/src/features/search/hooks/useAirportSearch';

type Props = {
  label: string;
  code?: string;
  onSelect: (code: string) => void;
  placeholder?: string;
};

export default function AirportAutocomplete({ label, code, onSelect, placeholder }: Props) {
  const [input, setInput] = useState(code ?? '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data, loading } = useAirportSearch(input);

  useEffect(() => { setInput(code ?? ''); }, [code]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  // ручной ввод 3-буквенного IATA — сразу применяем
  useEffect(() => {
    const v = (input || '').trim().toUpperCase();
    const current = (code ?? '').trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(v) && v !== current) {
        onSelect(v);
    }
    // важно: не зависим от onSelect, чтобы не триггерить эффект на каждый новый колбэк
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, code]);

  const renderItem = (a: Airport) =>
    `${a.city}${a.country ? ', ' + a.country : ''} — ${a.name} (${a.code})`;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <Form.Label className="form-label">{label}</Form.Label>
      <Form.Control
        value={input}
        placeholder={placeholder ?? 'Город/аэропорт/IATA'}
        onChange={(e) => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && (loading || data.length > 0) && (
        <div
          style={{
            position: 'absolute', zIndex: 1000, left: 0, right: 0, top: '100%',
            background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', borderTop: 'none',
            borderRadius: '0 0 .375rem .375rem', maxHeight: 280, overflowY: 'auto'
          }}
          role="listbox"
        >
          {loading && (
            <div className="d-flex align-items-center p-2 gap-2">
              <Spinner size="sm" /> <span className="text-muted">Ищем аэропорты…</span>
            </div>
          )}
          <ListGroup variant="flush">
            {data.map((a) => (
              <ListGroup.Item
                action key={a.code}
                onClick={() => { onSelect(a.code); setInput(a.code); setOpen(false); }}
              >
                <div className="fw-semibold">{a.city} {a.country ? `(${a.country})` : ''}</div>
                <div className="text-muted small">{a.name} • {a.code}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
}