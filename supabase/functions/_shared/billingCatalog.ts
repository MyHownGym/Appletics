// Prices are found by lookup key (appletics_<tier>_<cycle>) in the Stripe account of the configured key and created
// once if missing, with the amounts below. The fixed IDs are the historical test prices, used when they exist.
export const billingCatalog = {
  basic: {
    monthly: { priceId: 'price_1UUOgF8BzvCIdmaEwdorohu0', amount: 590 },
    annual_monthly: { priceId: 'price_1UUOgF8BzvCIdmaE0wn1rjpe', amount: 390 },
    annual: { priceId: 'price_1UUOgF8BzvCIdmaEzFZbAgxa', amount: 3900 },
  },
  pro: {
    monthly: { priceId: 'price_1UURPr8BzvCIdmaEJSylVEap', amount: 990 },
    annual_monthly: { priceId: 'price_1UURQM8BzvCIdmaEkTibasMl', amount: 790 },
    annual: { priceId: 'price_1UURQs8BzvCIdmaE4a7knhl7', amount: 7900 },
  },
  elite: {
    monthly: { priceId: 'price_1UURRZ8BzvCIdmaE2w4dVEeR', amount: 1990 },
    annual_monthly: { priceId: 'price_1UURRn8BzvCIdmaEJmWyU7gI', amount: 1590 },
    annual: { priceId: 'price_1UURRn8BzvCIdmaEBcrfzUok', amount: 15900 },
  },
  club_basic: {
    monthly: { priceId: 'price_1UURRn8BzvCIdmaEnB7UfPOl', amount: 2990 },
    annual_monthly: { priceId: 'price_1UURRo8BzvCIdmaElvW42ERA', amount: 2490 },
    annual: { priceId: 'price_1UURRo8BzvCIdmaEDclWKAdJ', amount: 24900 },
  },
  club_pro: {
    monthly: { priceId: 'price_1UURRo8BzvCIdmaET0EAoClV', amount: 5990 },
    annual_monthly: { priceId: 'price_1UURRp8BzvCIdmaEqhXzovfa', amount: 4990 },
    annual: { priceId: 'price_1UURRp8BzvCIdmaEeT8ScJOk', amount: 49900 },
  },
  club_elite: {
    monthly: { priceId: 'price_1UURRp8BzvCIdmaEJTEvIRD7', amount: 9990 },
    annual_monthly: { priceId: 'price_1UURRq8BzvCIdmaEZGaYYYaC', amount: 7990 },
    annual: { priceId: 'price_1UURRq8BzvCIdmaE36BhH1Pg', amount: 79900 },
  },
} as const;
export type BillingTier = keyof typeof billingCatalog;
export type BillingCycle = 'monthly' | 'annual_monthly' | 'annual';
type Offer = { priceId: string; amount: number };
type Catalog = Record<BillingTier, Record<BillingCycle, Offer>>;
let current: Catalog = billingCatalog as unknown as Catalog;
let liveCatalog: Promise<Catalog> | null = null;
const tierNames: Record<BillingTier, string> = {
  basic: 'Appletics Basic', pro: 'Appletics Pro', elite: 'Appletics Elite',
  club_basic: 'Appletics Club Basic', club_pro: 'Appletics Club Pro', club_elite: 'Appletics Club Elite',
};
export function activeCatalog(): Catalog { return current; }
export const lookupKey = (tier: string, cycle: string) => `appletics_${tier}_${cycle}`;

// deno-lint-ignore no-explicit-any
async function buildCatalog(stripe: any, live: boolean): Promise<Catalog> {
  const wanted = Object.entries(billingCatalog).flatMap(([tier, cycles]) => Object.entries(cycles).map(([cycle, offer]) => ({ tier: tier as BillingTier, cycle: cycle as BillingCycle, amount: offer.amount })));
  // deno-lint-ignore no-explicit-any
  const found = new Map<string, any>();
  for (let i = 0; i < wanted.length; i += 10) {
    const keys = wanted.slice(i, i + 10).map(item => lookupKey(item.tier, item.cycle));
    const list = await stripe.prices.list({ lookup_keys: keys, active: true, limit: 10 });
    for (const price of list.data) if (price.livemode === live) found.set(price.lookup_key, price);
  }
  const products = new Map<BillingTier, string>();
  const result = {} as Catalog;
  for (const item of wanted) {
    const key = lookupKey(item.tier, item.cycle);
    let price = found.get(key);
    if (!price) {
      let productId = products.get(item.tier);
      if (!productId) {
        const existing = await stripe.products.search({ query: `metadata['appletics_tier']:'${item.tier}' AND active:'true'` }).catch(() => ({ data: [] }));
        productId = existing.data[0]?.id ?? (await stripe.products.create({ name: tierNames[item.tier], metadata: { app: 'appletics', appletics_tier: item.tier } }, { idempotencyKey: `appletics:product:${live ? 'live' : 'test'}:${item.tier}:v1` })).id;
        products.set(item.tier, productId!);
      }
      price = await stripe.prices.create({
        product: productId, currency: 'chf', unit_amount: item.amount, lookup_key: key,
        recurring: { interval: item.cycle === 'annual' ? 'year' : 'month', interval_count: 1 },
        metadata: { app: 'appletics', tier: item.tier, cycle: item.cycle },
      }, { idempotencyKey: `appletics:price:${live ? 'live' : 'test'}:${key}:${item.amount}:v1` });
    }
    (result[item.tier] ??= {} as Record<BillingCycle, Offer>)[item.cycle] = { priceId: price.id, amount: item.amount };
  }
  return result;
}

// Call once per request, right after creating the Stripe client.
// deno-lint-ignore no-explicit-any
export async function activateCatalog(stripe: any, live: boolean) {
  if (!liveCatalog) liveCatalog = (async () => {
    if (!live) {
      // Keep the historical fixed test prices when they exist in this Stripe account; otherwise create test prices by lookup key.
      const fixed = await stripe.prices.retrieve(billingCatalog.pro.monthly.priceId).then(() => true).catch(() => false);
      if (fixed) return billingCatalog as unknown as Catalog;
    }
    return buildCatalog(stripe, live);
  })().catch(error => { liveCatalog = null; throw error; });
  current = await liveCatalog;
}
export function getOffer(tier: string, cycle: string) {
  if (!Object.prototype.hasOwnProperty.call(current, tier) || !['monthly', 'annual_monthly', 'annual'].includes(cycle)) return null;
  return current[tier as BillingTier][cycle as BillingCycle];
}
export function offerForPrice(priceId: string) {
  for (const [tier, cycles] of Object.entries(current)) {
    for (const [cycle, value] of Object.entries(cycles)) {
      if (value.priceId === priceId) return { tier: tier as BillingTier, cycle: cycle as BillingCycle, ...value };
    }
  }
  return null;
}
