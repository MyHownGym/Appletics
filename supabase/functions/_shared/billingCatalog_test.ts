import { billingCatalog, getOffer, offerForPrice } from './billingCatalog.ts';
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
Deno.test('The test catalogue contains exactly 18 unique fixed paid prices', () => {
  const entries = Object.values(billingCatalog).flatMap(cycles => Object.values(cycles));
  assert(entries.length === 18, 'Expected six tiers and three billing cycles');
  assert(new Set(entries.map(entry => entry.priceId)).size === 18, 'Price IDs must be unique');
  for (const entry of entries) {
    assert(entry.priceId.startsWith('price_'), 'Only fixed Stripe price IDs are accepted');
    assert(Number.isInteger(entry.amount) && entry.amount > 0, 'Prices must be positive CHF minor units');
    assert(offerForPrice(entry.priceId) !== null, 'Each price must round-trip to its tier and cycle');
  }
});
Deno.test('Basic prices match the approved CHF 5.90 / CHF 3.90 / CHF 39 catalogue', () => {
  assert(getOffer('basic', 'monthly')?.amount === 590, 'Monthly price changed');
  assert(getOffer('basic', 'annual_monthly')?.amount === 390, 'Committed monthly price changed');
  assert(getOffer('basic', 'annual')?.amount === 3900, 'Annual price changed');
});
Deno.test('Unknown prices and prototype keys cannot produce an entitlement', () => {
  assert(getOffer('__proto__', 'monthly') === null, 'Prototype key accepted');
  assert(getOffer('constructor', 'monthly') === null, 'Inherited key accepted');
  assert(getOffer('elite', 'free') === null, 'Unapproved cycle accepted');
  assert(offerForPrice('price_unknown') === null, 'Unknown price grants access');
  assert(offerForPrice('price_1UUPDe8BzvCIdmaEIArmQNvx') === null, 'Zero-value legacy price grants access');
});
