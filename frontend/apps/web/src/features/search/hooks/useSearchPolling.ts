'use client';

import { useEffect, useRef, useState } from 'react';

type Offer = any;
type Results = {
  progress: number;
  complete: boolean;
  nextCursor?: string | null;
  items: Offer[];
};

function normalize(json: any): Results {
  // Вариант А: ожидаемый контракт { items, complete, progress, nextCursor }
  if (json && Array.isArray(json.items)) {
    return {
      progress: json.progress ?? (json.complete ? 100 : 0),
      complete: !!json.complete,
      nextCursor: json.nextCursor ?? null,
      items: json.items,
    };
  }

  // Вариант B: "старый" контракт { offers, partial, cursor? }
  if (json && Array.isArray(json.offers)) {
    const complete = json.partial === false;
    return {
      progress: complete ? 100 : 0,
      complete,
      nextCursor: json.cursor ?? null,
      items: json.offers,
    };
  }

  // Иногда оборачивают в { data: ... }
  if (json?.data) return normalize(json.data);

  // Фоллбек — пустая страница (не ломаем UI)
  return { progress: 100, complete: true, nextCursor: null, items: [] };
}

export default function useSearchPolling(searchId?: string, enabled: boolean = false) {
  const [data, setData] = useState<Results | undefined>(undefined);
  const cursorRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchId || !enabled) {
      setData(undefined);
      return;
    }

    const controller = new AbortController();
    cursorRef.current = null;
    setData(undefined);

    const tick = async () => {
      try {
        const url = new URL(`/api/bff/v1/search/${searchId}/results`, window.location.origin);
        if (cursorRef.current) url.searchParams.set('cursor', cursorRef.current);

        const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        const text = await res.text();

        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const page = normalize(text ? JSON.parse(text) : {});
        cursorRef.current = page.nextCursor ?? null;

        setData(prev => ({
          progress: page.progress ?? prev?.progress ?? 0,
          complete: !!page.complete,
          nextCursor: page.nextCursor ?? null,
          items: [...(prev?.items ?? []), ...(page.items ?? [])],
        }));

        if (!page.complete) {
          timerRef.current = setTimeout(tick, 1000);
        }
      } catch {
        // мягкий ретрай, если сеть/сервер отвалился
        timerRef.current = setTimeout(tick, 1500);
      }
    };

    tick();

    return () => {
      controller.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchId, enabled]);

  return { data };
}
