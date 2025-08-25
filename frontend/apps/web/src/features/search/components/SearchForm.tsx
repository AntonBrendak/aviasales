'use client';

import { useMemo, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import CityAutocomplete from './CityAutocomplete';

type City = { city: string; country?: string; cityCode?: string; label: string };

type Props = {
  loading?: boolean;
  onSubmit: (payload: {
    originCity: City;
    destinationCity: City;
    departDate: string;
    returnDate: string;
    cabin?: 'ANY'|'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST';
    pax: { adults: number; children?: number; infants?: number };
  }) => void | Promise<void>;
};

function toISO(d: Date) { return d.toISOString().slice(0,10); }

export default function SearchForm({ loading, onSubmit }: Props) {
  const today = useMemo(() => new Date(), []);
  const plus7 = useMemo(() => { const x = new Date(); x.setDate(x.getDate()+7); return x; }, []);
  const [form, setForm] = useState({
    originCity: null as City | null,
    destinationCity: null as City | null,
    departDate: toISO(today),
    returnDate: toISO(plus7),
    cabin: 'ANY' as const,
    pax: { adults: 1, children: 0, infants: 0 },
  });
  const disabled = !!loading;

  return (
    <Form onSubmit={async (e) => {
      e.preventDefault();
      if (!form.originCity || !form.destinationCity) {
        alert('Выберите города вылета и прилёта');
        return;
      }
      await onSubmit({
        originCity: form.originCity,
        destinationCity: form.destinationCity,
        departDate: form.departDate,
        returnDate: form.returnDate,
        cabin: form.cabin,
        pax: {
          adults: Math.max(1, Number(form.pax.adults||1)),
          children: Math.max(0, Number(form.pax.children||0)),
          infants: Math.max(0, Number(form.pax.infants||0)),
        },
      });
    }}>
      <Row className="g-3">
        <Col md={12}>
          <CityAutocomplete
            label="Город вылета"
            value={form.originCity}
            onSelect={(v) => setForm(f => ({ ...f, originCity: v }))}
            placeholder="Начните вводить город…"
          />
        </Col>
        <Col md={12}>
          <CityAutocomplete
            label="Город прилёта"
            value={form.destinationCity}
            onSelect={(v) => setForm(f => ({ ...f, destinationCity: v }))}
            placeholder="Начните вводить город…"
          />
        </Col>

        <Col md={6}>
          <Form.Label>Дата вылета: от</Form.Label>
          <Form.Control type="date" value={form.departDate}
            onChange={(e)=>setForm(f=>({ ...f, departDate: e.target.value }))} disabled={disabled}/>
        </Col>
        <Col md={6}>
          <Form.Label>Дата вылета: до</Form.Label>
          <Form.Control type="date" value={form.returnDate} min={form.departDate}
            onChange={(e)=>setForm(f=>({ ...f, returnDate: e.target.value }))} disabled={disabled}/>
        </Col>

        <Col md={6}>
          <Form.Label>Класс</Form.Label>
          <Form.Select value={form.cabin} onChange={(e)=>setForm(f=>({ ...f, cabin: e.target.value as any }))} disabled={disabled}>
            <option value="ANY">Любой</option>
            <option value="ECONOMY">ECONOMY</option>
            <option value="PREMIUM_ECONOMY">PREMIUM_ECONOMY</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="FIRST">FIRST</option>
          </Form.Select>
        </Col>

        <Col md={6}>
          <Form.Label>Взрослые</Form.Label>
          <Form.Control type="number" min={1} max={9} value={form.pax.adults}
            onChange={(e)=>setForm(f=>({ ...f, pax:{ ...f.pax, adults:+e.target.value } }))} disabled={disabled}/>
        </Col>
        <Col md={6}>
          <Form.Label>Дети</Form.Label>
          <Form.Control type="number" min={0} max={8} value={form.pax.children}
            onChange={(e)=>setForm(f=>({ ...f, pax:{ ...f.pax, children:+e.target.value } }))} disabled={disabled}/>
        </Col>
        <Col md={6}>
          <Form.Label>Младенцы</Form.Label>
          <Form.Control type="number" min={0} max={8} value={form.pax.infants}
            onChange={(e)=>setForm(f=>({ ...f, pax:{ ...f.pax, infants:+e.target.value } }))} disabled={disabled}/>
        </Col>

        <Col xs={12}>
          <Button type="submit" className="w-100" disabled={disabled}>{loading ? 'Ищем…' : 'Search'}</Button>
        </Col>
      </Row>
    </Form>
  );
}