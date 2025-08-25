import { http, HttpResponse } from 'msw';
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const handlers = [
  http.post(`${API}/v1/search`, async ({ request }) => {
    // можно вернуть стаб, если нет бэка
    return HttpResponse.json({ searchId: 'mock-123' }, { status: 201 });
  }),
  http.get(`${API}/v1/search/:id/results`, ({ params }) => {
    const progress = Math.min(100, Math.floor(Math.random()*30)+70);
    return HttpResponse.json({
      progress, complete: progress >= 95, nextCursor: null,
      items: progress < 80 ? [] : [
        { id:'offer1', price:{amount:135.2, currency:'EUR'}, slices:[{from:'DUS',to:'CDG',departAt:new Date().toISOString(), arriveAt:new Date().toISOString(), carrier:'LH'}]}
      ]
    });
  })
];