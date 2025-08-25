'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import SearchForm from '@/src/features/search/components/SearchForm';
import ResultsList from '@/src/features/search/components/ResultsList';

type City = {
  city: string;
  country?: string;
  cityCode: string; // PAR/LON/DUS/...
  label?: string;
};

type OfferSegment = {
  from: string;
  to: string;
  dep: string; // ISO
  arr: string; // ISO
  flight?: string;
  carrier?: string;
};

type Offer = {
  uid: string;
  price: { amount: number; currency: string };
  carrier?: string;
  segments?: OfferSegment[];   // BFF/новое
  slices?: OfferSegment[];     // fallback
  baggage?: { pieces?: number; weightKg?: number };
  cabin?: string;
  source?: string;
};

// ------ helpers ------
function normalizeOffer(o: any): Offer {
  const segments: OfferSegment[] = Array.isArray(o?.segments)
    ? o.segments
    : Array.isArray(o?.slices)
      ? o.slices
      : [];

  return {
    uid: String(o.uid ?? o.id ?? crypto.randomUUID()),
    price: {
      amount: Number(o?.price?.amount ?? o?.total_amount ?? 0),
      currency: String(o?.price?.currency ?? o?.total_currency ?? 'EUR'),
    },
    carrier: o?.carrier ?? o?.owner?.iata_code,
    segments,
    baggage: o?.baggage,
    cabin: o?.cabin ?? o?.cabin_class,
    source: o?.source ?? o?.owner?.name,
  };
}

function minutesBetween(aISO: string, bISO: string) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.max(0, Math.round((b - a) / 60000));
}

// форма -> контракт BFF (originCity/destinationCity + dateRange + pax[])
function toBffPayload(form: any) {
  const ensureCity = (obj: any, fallbackField: string): City => {
    const code =
      (obj?.cityCode ?? (form?.[fallbackField] as string | undefined) ?? '')
        .toString().trim().toUpperCase();

    const name = (obj?.city ?? obj?.label ?? code).toString();

    return {
      city: name,
      country: obj?.country,
      cityCode: code,
      label: obj?.label ?? `${name}${obj?.country ? `, ${obj.country}` : ''}`,
    };
  };

  const originCity: City = ensureCity(form.originCity, 'origin');
  const destinationCity: City = ensureCity(form.destinationCity, 'destination');

  const from = String(form.departDate);
  const to = String(form.returnDate || form.departDate);

  const adt = Math.max(1, Number(form?.pax?.adults ?? 1));
  const chd = Math.max(0, Number(form?.pax?.children ?? 0));
  const inf = Math.max(0, Number(form?.pax?.infants ?? 0));
  const pax: Array<{ type: 'ADT' | 'CHD' | 'INF'; count: number }> = [
    { type: 'ADT', count: adt },
    ...(chd ? [{ type: 'CHD', count: chd }] : []),
    ...(inf ? [{ type: 'INF', count: inf }] : []),
  ];

  const cabinRaw = (form.cabin ?? '').toString().toUpperCase();
  const cabin =
    cabinRaw && cabinRaw !== 'ANY'
      ? (cabinRaw as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST')
      : undefined;

  return {
    originCity,
    destinationCity,
    dateRange: { from, to },
    pax,
    ...(cabin ? { cabin } : {}),
    currency: 'EUR',
  };
}

// ------ component ------
export default function SearchClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [cursor, setCursor] = useState<string | null>(null); // BFF/Duffel meta.after
  const [indeterminate, setIndeterminate] = useState(false); // для полосатого прогресса

  // UI-сортировка (единый блок — внутри ResultsList, но состояние храним здесь)
  const [sortBy, setSortBy] = useState<'price' | 'depart' | 'duration'>('price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // пагинация по уже загруженным (чисто визуальная)
  const [page, setPage] = useState(1);
  const perPage = 5;

  const lastPayloadRef = useRef<any | null>(null);

  // сортируем загруженные
  const sorted = useMemo(() => {
    const list = [...offers];
    const cmp = (a: Offer, b: Offer) => {
      let va = 0, vb = 0;
      if (sortBy === 'price') {
        va = a.price.amount; vb = b.price.amount;
      } else if (sortBy === 'depart') {
        va = new Date(a.segments?.[0]?.dep ?? 0).getTime();
        vb = new Date(b.segments?.[0]?.dep ?? 0).getTime();
      } else {
        const da = a.segments?.[0]?.dep, aa = a.segments?.at(-1)?.arr;
        const db = b.segments?.[0]?.dep, ab = b.segments?.at(-1)?.arr;
        const dura = da && aa ? minutesBetween(da, aa) : 0;
        const durb = db && ab ? minutesBetween(db, ab) : 0;
        va = dura; vb = durb;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    };
    return list.sort(cmp);
  }, [offers, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const visible = sorted.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  // ===== API: постраничная загрузка =====
  async function fetchPage(payload: any, after?: string | null) {
    // добавляем limit=5 и курсор в query-string, тело — тот же payload
    const qs = new URLSearchParams();
    qs.set('limit', '5');
    if (after) qs.set('after', after);

    const res = await fetch(`/api/bff/v1/search?${qs.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const txt = await res.text();
        const j = JSON.parse(txt);
        if (j?.error?.message) msg = j.error.message;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    // поддерживаем разные формы ответа:
    // { items, after }  |  { offers, meta:{after} }  |  { data:{offers}, meta:{after} }
    const j = await res.json();
    const items: any[] =
      (Array.isArray(j?.items) && j.items) ||
      (Array.isArray(j?.offers) && j.offers) ||
      (Array.isArray(j?.data?.offers) && j.data.offers) ||
      [];
    const next: string | null =
      (j?.after ?? j?.meta?.after ?? null) || null;

    return { items, after: next };
  }

  async function runSearch(formPayload: any) {
    setError(null);
    setLoading(true);
    setIndeterminate(false);
    setOffers([]);
    setCursor(null);
    setPage(1);

    try {
      const payload = toBffPayload(formPayload);

      // валидация именно городских кодов
      const iata3 = /^[A-Z]{3}$/;
      const oc = payload.originCity?.cityCode?.toUpperCase();
      const dc = payload.destinationCity?.cityCode?.toUpperCase();
      if (!iata3.test(oc) || !iata3.test(dc)) {
        throw new Error('Выберите города из подсказки (городской IATA-код, напр. PAR/LON/DUS).');
      }

      lastPayloadRef.current = payload;

      // первая страница
      const first = await fetchPage(payload, null);
      setOffers(first.items.map(normalizeOffer));
      setCursor(first.after);
      setIndeterminate(Boolean(first.after)); // есть продолжение — включаем «полоску»

      // если есть ещё — дотягиваем последовательно
      let next = first.after;
      while (next) {
        const page = await fetchPage(payload, next);
        setOffers(prev => [...prev, ...page.items.map(normalizeOffer)]);
        next = page.after;
        setCursor(next);
      }

      // всё дошло
      setIndeterminate(false);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
      setIndeterminate(false);
    } finally {
      setLoading(false);
    }
  }

  // ручная догрузка (если когда-то захочешь кнопку «Ещё»)
  async function loadMore() {
    const payload = lastPayloadRef.current;
    if (!payload || !cursor) return;
    setIndeterminate(true);
    try {
      const page = await fetchPage(payload, cursor);
      setOffers(prev => [...prev, ...page.items.map(normalizeOffer)]);
      setCursor(page.after);
      if (!page.after) setIndeterminate(false);
    } catch (e: any) {
      setError(e?.message ?? 'Load more failed');
      setIndeterminate(false);
    }
  }

  useEffect(() => {
    // если сортировку поменяли — на первую страницу
    setPage(1);
  }, [sortBy, sortDir]);

  const complete = !indeterminate && !cursor;

  return (
    <Container className="py-4">
      <Row>
        <Col lg={4}>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          <SearchForm loading={loading} onSubmit={runSearch} />
        </Col>

        <Col lg={8}>
          <ResultsList
            // данные/состояния
            offers={visible}
            isLoading={loading}
            complete={complete}
            // прогресс:  индетерминатный — полосатый (внутри ResultsList)
            progress={complete ? 100 : 0}
            indeterminate={!complete}

            // сортировка — единый блок ТОЛЬКО здесь (справа)
            sortBy={sortBy}
            sortDir={sortDir}
            onSortBy={setSortBy}
            onSortDir={setSortDir}

            // пагинация отображения
            page={page}
            totalPages={Math.max(1, Math.ceil(sorted.length / perPage))}
            onPage={setPage}
          />

          {/* при желании можно показать кнопку «Ещё», если бэк отдаёт after постранично */}
          {/* {!complete && (
            <div className="d-flex justify-content-center mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={loadMore}>Ещё</button>
            </div>
          )} */}
        </Col>
      </Row>
    </Container>
  );
}