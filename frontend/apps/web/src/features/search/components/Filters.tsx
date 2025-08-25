'use client';

import { useMemo } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import type { Filters } from '../utils/applyFilters';

type Offer = any;

type Props = { offers: Offer[]; value: Filters; onChange: (v: Filters) => void };

export default function Filters({ offers, value, onChange }: Props) {
  const carriers = useMemo(() => {
    const set = new Set<string>();
    offers.forEach(o => {
      if (o.carrier) set.add(o.carrier);
      (o.slices ?? o.segments ?? []).forEach((s: any) => s?.carrier && set.add(s.carrier));
    });
    return Array.from(set).sort();
  }, [offers]);

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(0, ...offers.map(o => o.price?.amount || 0))),
    [offers]
  );

  const cabins = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      const c =
        (o.cabin ??
          o.fare?.cabin ??
          o.fareClass ??
          o.fareFamily?.cabin ??
          (o.fares && o.fares[0]?.cabin))?.toString().toUpperCase();
      if (c) set.add(c);
    });
    return ['ANY', ...Array.from(set).sort()];
  }, [offers]);

  return (
    <div className="mb-3">
      <Row className="g-3">
        <Col md={6}>
          <Form.Label>Максимальная цена (EUR)</Form.Label>
          <Form.Range
            min={0} max={Math.max(50, maxPrice)} step={1}
            value={value.maxPrice ?? Math.max(50, maxPrice)}
            onChange={(e) => onChange({ ...value, maxPrice: Number(e.target.value) })}
          />
          <div className="small text-muted">{value.maxPrice ?? maxPrice} EUR</div>
        </Col>

        <Col md={6}>
          <Form.Label>Время вылета (часы)</Form.Label>
          <div className="d-flex gap-2">
            <Form.Select
              value={value.departHour?.[0] ?? 0}
              onChange={(e) => onChange({ ...value, departHour: [Number(e.target.value), value.departHour?.[1] ?? 23] })}
            >
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h.toString().padStart(2,'0')}</option>)}
            </Form.Select>
            <Form.Select
              value={value.departHour?.[1] ?? 23}
              onChange={(e) => onChange({ ...value, departHour: [value.departHour?.[0] ?? 0, Number(e.target.value)] })}
            >
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h.toString().padStart(2,'0')}</option>)}
            </Form.Select>
          </div>
        </Col>

        <Col md={12}>
          <Form.Check
            type="switch"
            id="with-baggage"
            label="Только с багажом"
            checked={!!value.withBaggage}
            onChange={(e) => onChange({ ...value, withBaggage: e.target.checked })}
          />
        </Col>

        <Col md={6}>
          <Form.Label>Класс</Form.Label>
          <Form.Select
            value={value.cabin ?? 'ANY'}
            onChange={(e) => onChange({ ...value, cabin: e.target.value as any })}
          >
            {cabins.map(c => <option key={c} value={c}>{c === 'ANY' ? 'Любой' : c}</option>)}
          </Form.Select>
        </Col>

        <Col md={12}>
          <Form.Label>Перевозчики</Form.Label>
          <div className="d-flex flex-wrap gap-3">
            {carriers.map((c) => {
              const checked = value.carriers?.includes(c) ?? false;
              return (
                <Form.Check
                  key={c} inline type="checkbox" id={`carrier-${c}`}
                  label={c} checked={checked}
                  onChange={(e) => {
                    const next = new Set(value.carriers ?? []);
                    e.target.checked ? next.add(c) : next.delete(c);
                    onChange({ ...value, carriers: Array.from(next) });
                  }}
                />
              );
            })}
          </div>
        </Col>
      </Row>
    </div>
  );
}
