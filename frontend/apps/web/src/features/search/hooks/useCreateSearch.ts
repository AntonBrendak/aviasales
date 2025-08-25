'use client';

import { useState } from 'react';

export type CreatePayload = any;
export type CreateResult = { searchId: string };

export function useCreateSearch() {
  const [isPending, setIsPending] = useState(false);

  async function mutateAsync(payload: CreatePayload): Promise<{ data: CreateResult }> {
    setIsPending(true);
    try {
      const res = await fetch('/api/bff/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const data = JSON.parse(text) as CreateResult;
      return { data };
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, mutateAsync };
}

export default useCreateSearch; // <-- default экспорт