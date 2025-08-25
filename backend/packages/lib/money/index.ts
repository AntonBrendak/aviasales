import Decimal from 'decimal.js';

export type Money = { amount: string; currency: string };
const MINOR: Record<string, number> = { JPY:0, HUF:0, KWD:3 };
const minor = (ccy: string) => MINOR[ccy] ?? 2;

export const make = (amount: string|number, currency: string): Money =>
  ({ amount: new Decimal(amount).toFixed(minor(currency)), currency });

export const add = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return make(new Decimal(a.amount).add(b.amount), a.currency);
};

export const sub = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return make(new Decimal(a.amount).sub(b.amount), a.currency);
};

export const zero = (ccy: string): Money => make(0, ccy);
export const isPositive = (m: Money) => new Decimal(m.amount).gt(0);