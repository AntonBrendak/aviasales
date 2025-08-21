import fc from 'fast-check';
import { make, add } from '../../packages/lib/money';

test('add is associative within same currency', () => {
  const arb = fc.double({ min: 0, max: 1e6 });
  return fc.assert(fc.property(arb, arb, arb, (x,y,z) => {
    const a = make(x,'EUR'), b = make(y,'EUR'), c = make(z,'EUR');
    expect(add(add(a,b),c).amount).toBe(add(a,add(b,c)).amount);
  }));
});