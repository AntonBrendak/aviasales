type SearchReq = {
  origin: string; destination: string;
  dateRange: { from: string; to: string };
  pax: Array<{ type:'ADT'|'CHD'|'INF'; count:number }>;
  cabin?: 'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST';
  currency?: string;
};

const TQ_BASE = process.env.TEQUILA_BASE_URL ?? 'https://tequila-api.kiwi.com';
const TQ_KEY  = process.env.TEQUILA_API_KEY!;

function isoToDMY(iso:string){ // 'YYYY-MM-DD' -> 'DD/MM/YYYY'
  const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`;
}

function mapCabin(c?:string){
  // Tequila поддерживает типы 'M' (economy) и т.п.; оставим без жёсткой привязки
  if (!c || c==='ECONOMY') return undefined;
  return c; // при необходимости маппить детальнее
}

export async function searchTequila(req: SearchReq) {
  const url = new URL(`${TQ_BASE}/v2/search`);
  url.searchParams.set('fly_from', req.origin);
  url.searchParams.set('fly_to',   req.destination);
  url.searchParams.set('date_from', isoToDMY(req.dateRange.from));
  url.searchParams.set('date_to',   isoToDMY(req.dateRange.to));
  url.searchParams.set('adults',    String(req.pax.find(p=>p.type==='ADT')?.count ?? 1));
  url.searchParams.set('children',  String(req.pax.find(p=>p.type==='CHD')?.count ?? 0));
  url.searchParams.set('infants',   String(req.pax.find(p=>p.type==='INF')?.count ?? 0));
  url.searchParams.set('curr',      req.currency ?? 'EUR');
  url.searchParams.set('limit',     '100');
  url.searchParams.set('sort',      'price');

  const cls = mapCabin(req.cabin);
  if (cls) url.searchParams.set('selected_cabins', cls);

  const res = await fetch(url, { headers: { apikey: TQ_KEY } });
  if (!res.ok) return [];
  const j = await res.json();
  const data = Array.isArray(j?.data) ? j.data : [];
  return data.map((x:any) => ({
    uid: String(x?.id),
    price: { amount: Number(x?.price ?? 0), currency: (req.currency ?? 'EUR') },
    carrier: Array.isArray(x?.airlines) ? x.airlines[0] : undefined,
    segments: (x?.route ?? []).map((r:any) => ({
      from: r?.flyFrom, to: r?.flyTo,
      dep: new Date((r?.dTimeUTC ?? r?.dTime) * 1000).toISOString(),
      arr: new Date((r?.aTimeUTC ?? r?.aTime) * 1000).toISOString(),
      flight: `${r?.airline ?? ''}${r?.flight_no ?? ''}`
    })),
    baggage: { pieces: 0 }, // у Tequila детальная платная кладь часто в extras; берём минимум
    source: 'TEQUILA',
  }));
}