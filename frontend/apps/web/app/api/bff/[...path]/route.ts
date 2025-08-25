export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

const BASE = process.env.BFF_TARGET_URL || 'http://localhost:3001';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

function buildTarget(req: NextRequest, path: string[]) {
  const u = new URL(req.url);
  return `${BASE}/${path.join('/')}${u.search || ''}`;
}

async function forward(req: NextRequest, path: string[]) {
  const target = buildTarget(req, path);

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  if (req.method === 'POST' && !headers.get('Idempotency-Key')) {
    headers.set('Idempotency-Key', randomUUID());
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();

  try {
    const res = await fetch(target, { method: req.method, headers, body });
    const out = new Headers(res.headers);
    out.delete('connection');
    return new Response(res.body, { status: res.status, headers: out });
  } catch (err: any) {
    if (USE_MOCKS) {
      const p = path.join('/');
      if (req.method === 'POST' && p === 'v1/search') {
        return Response.json({ searchId: 'mock-123' }, { status: 201 });
      }
      if (req.method === 'GET' && /^v1\/search\/[^/]+\/results$/.test(p)) {
        return Response.json(
          {
            progress: 100,
            complete: true,
            nextCursor: null,
            items: [
              {
                id: 'offer1',
                price: { amount: 135.2, currency: 'EUR' },
                slices: [
                  {
                    from: 'DUS',
                    to: 'BCN',
                    departAt: new Date().toISOString(),
                    arriveAt: new Date().toISOString(),
                    carrier: 'LH',
                  },
                ],
              },
            ],
          },
          { status: 200 }
        );
      }
    }
    return Response.json(
      { error: 'BFF_UNREACHABLE', target, details: String(err?.cause || err) },
      { status: 502 }
    );
  }
}

// 👇 Обрати внимание: ctx.params — это Promise. Его надо await.
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}