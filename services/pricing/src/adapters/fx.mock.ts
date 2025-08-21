const table: Record<string, number> = {
  'EUR->USD': 1.10, 'USD->EUR': 0.91,
  'EUR->JPY': 170.0,'JPY->EUR': 0.0059,
  'EUR->EUR': 1, 'USD->USD': 1, 'JPY->JPY': 1,
};

export async function getFxRate(from: string, to: string): Promise<number> {
  const k = `${from.toUpperCase()}->${to.toUpperCase()}`;
  if (!(k in table)) throw new Error(`FX mock: no rate ${k}`);
  return table[k];
}