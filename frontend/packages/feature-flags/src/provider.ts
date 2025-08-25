export type FlagKey = 'newSearchUI' | 'enablePayments' | 'guardedAI';
let cache = new Map<FlagKey, boolean>();
export function setFlag(k: FlagKey, v: boolean) { cache.set(k, v); }
export function isEnabled(k: FlagKey) { return cache.get(k) ?? false; }