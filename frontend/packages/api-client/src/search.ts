import { apiHttp } from './http';

export type CreateSearchBody = {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string | null;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  pax: { adults: number; children?: number; infants?: number };
};
export type OfferSlice = {
  from: string; to: string; departAt: string; arriveAt: string; carrier: string;
};
export type Offer = {
  id: string;
  brand?: string | null;
  price: { amount: number; currency: string };
  slices: OfferSlice[];
};
export type Results = {
  progress: number;
  complete: boolean;
  nextCursor?: string | null;
  items: Offer[];
};

const http = apiHttp();

export function createSearch(body: CreateSearchBody, opts?: { signal?: AbortSignal }) {
  return http.post<{ searchId: string }>('/v1/search', body, { signal: opts?.signal });
}
export function getResults(id: string, cursor?: string | null, opts?: { signal?: AbortSignal }) {
  return http.get<Results>(`/v1/search/${id}/results`, { params: { cursor: cursor ?? undefined }, signal: opts?.signal });
}