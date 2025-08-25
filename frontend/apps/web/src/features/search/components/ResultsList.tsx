'use client';

import { Card, Placeholder, ProgressBar, Form, ButtonGroup, ToggleButton, Pagination } from 'react-bootstrap';

type Offer = any;

type Props = {
  offers: Offer[];
  progress: number;      // 0..100 (когда indeterminate=false)
  indeterminate?: boolean; // если true — показываем полосатую анимацию вместо %.
  complete: boolean;
  isLoading: boolean;
  paxTotal?: number;

  // сортировка
  sortBy: 'price'|'depart'|'duration';
  sortDir: 'asc'|'desc';
  onSortBy: (v: 'price'|'depart'|'duration') => void;
  onSortDir: (v: 'asc'|'desc') => void;

  // пагинация
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
};

function fmtDT(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}
function durationText(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return '';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms <= 0) return '';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} ч ${m.toString().padStart(2, '0')} мин`;
}
function offerCabin(o: any): string | undefined {
  return (
    o.cabin ??
    o.fare?.cabin ??
    o.fareClass ??
    o.fareFamily?.cabin ??
    (o.fares && o.fares[0]?.cabin) ??
    undefined
  )?.toString().toUpperCase();
}

export default function ResultsList({
  offers, progress, indeterminate, complete, isLoading, paxTotal,
  sortBy, sortDir, onSortBy, onSortDir,
  page, totalPages, onPage,
}: Props) {
  return (
    <div>
      {/* сорт-бар — ЕДИНСТВЕННЫЙ */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div style={{minWidth: 260}}>
          <Form.Select value={sortBy} onChange={(e) => onSortBy(e.target.value as any)}>
            <option value="price">Сортировать: Цена</option>
            <option value="depart">Сортировать: Дата вылета</option>
            <option value="duration">Сортировать: Время в пути</option>
          </Form.Select>
        </div>
        <ButtonGroup>
          <ToggleButton
            id="sort-asc" type="radio" variant={sortDir === 'asc' ? 'primary' : 'outline-primary'}
            name="sortdir" value="asc" checked={sortDir === 'asc'} onChange={() => onSortDir('asc')}
          >
            ↑
          </ToggleButton>
          <ToggleButton
            id="sort-desc" type="radio" variant={sortDir === 'desc' ? 'primary' : 'outline-primary'}
            name="sortdir" value="desc" checked={sortDir === 'desc'} onChange={() => onSortDir('desc')}
          >
            ↓
          </ToggleButton>
        </ButtonGroup>
      </div>

      {/* прогресс — один блок, «полосатый» когда идёт догрузка страниц */}
      <div className="mb-3" aria-live="polite">
        {indeterminate ? (
          <ProgressBar animated striped now={100} label="Загрузка…" />
        ) : (
          <ProgressBar now={progress} label={`${progress}%`} />
        )}
      </div>

      {/* список */}
      {isLoading && [...Array(3)].map((_, i) => (
        <Card key={`sk-${i}`} className="mb-2">
          <Card.Body>
            <Placeholder as="div" animation="glow">
              <Placeholder xs={6} /> <Placeholder xs={4} /> <Placeholder xs={8} />
            </Placeholder>
          </Card.Body>
        </Card>
      ))}

      {offers.map((o: any) => {
        const segs = (o.slices ?? o.segments ?? []) as any[];
        const first = segs[0];
        const last  = segs[segs.length - 1];
        const from  = first?.from;
        const to    = last?.to;
        const dep   = first?.departAt ?? first?.dep;
        const arr   = last?.arriveAt ?? last?.arr;
        const priceAmount = o.price?.amount ?? 0;
        const currency = o.price?.currency ?? '';
        const total = paxTotal && paxTotal > 1 ? priceAmount * paxTotal : priceAmount;
        const key = o.id || o.uid || `${from}-${to}-${dep}-${priceAmount}`;
        const cabin = offerCabin(o);

        return (
          <Card key={key} className="mb-2">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">
                    {from} → {to}
                    {cabin ? <span className="badge bg-secondary ms-2">{cabin}</span> : null}
                  </div>
                  <div className="text-muted small mt-1">
                    Вылет: {fmtDT(dep)} · Прилёт: {fmtDT(arr)} · В пути: {durationText(dep, arr)}
                  </div>
                  <div className="text-muted small mt-1">
                    {segs?.map((s, i) => (
                      <span key={i}>
                        {(s.carrier || o.carrier || '').toString()} {s.from}→{s.to} ({fmtDT(s.departAt ?? s.dep)}){' '}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-end">
                  <div className="fw-semibold">{total.toFixed(2)} {currency}</div>
                  {paxTotal && paxTotal > 1 ? (
                    <div className="text-muted small">{priceAmount.toFixed(2)} × {paxTotal}</div>
                  ) : null}
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })}

      {/* пагинация видимой части */}
      <div className="d-flex justify-content-center mt-3">
        <Pagination className="mb-0">
          <Pagination.First disabled={page<=1} onClick={() => onPage(1)} />
          <Pagination.Prev  disabled={page<=1} onClick={() => onPage(page-1)} />
          {Array.from({length: totalPages}, (_,i)=>i+1).slice(
              Math.max(0, page-3), Math.max(0, page-3)+7
            ).map(p => (
              <Pagination.Item key={p} active={p===page} onClick={() => onPage(p)}>
                {p}
              </Pagination.Item>
          ))}
          <Pagination.Next disabled={page>=totalPages} onClick={() => onPage(page+1)} />
          <Pagination.Last disabled={page>=totalPages} onClick={() => onPage(totalPages)} />
        </Pagination>
      </div>

      {complete && offers.length === 0 && <div className="mt-3">Ничего не найдено.</div>}
    </div>
  );
}