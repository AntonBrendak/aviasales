export class BrandsService {
  resolve(offer: any): 'BASIC'|'STANDARD'|'FLEX' {
    const fam = String(offer.fareFamily ?? 'STANDARD').toUpperCase();
    if (/(LIGHT|BASIC|HAND|LITE)/.test(fam)) return 'BASIC';
    if (/(PLUS|STANDARD|CLASSIC)/.test(fam)) return 'STANDARD';
    return 'FLEX';
  }
}