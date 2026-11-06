// Pure Stripe request planning. No credentials, network calls, or payment simulation.
import type { BillingCycle } from './billingCatalog.ts';

export function addManagementMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp * 1000);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return Math.floor(date.getTime() / 1000);
}

export function managementPeriodEnd(subscription: any): number {
  const value = subscription?.items?.data?.[0]?.current_period_end ?? subscription?.current_period_end;
  if (!Number.isInteger(value) || value <= 0) throw new Error('Échéance Stripe indisponible. Vérifiez le paiement puis réessayez.');
  return value;
}

export function managementCommitmentEnd(subscription: any, cycle: string, timestamp: number): number | null {
  if (cycle !== 'annual_monthly') return null;
  const anchor = Number(subscription.metadata?.appletics_commitment_start) || subscription.start_date;
  if (!Number.isInteger(anchor) || anchor <= 0) throw new Error('Échéance Stripe indisponible. Vérifiez le paiement puis réessayez.');
  let end = addManagementMonths(anchor, 12);
  for (let years = 2; end <= timestamp && years < 100; years++) end = addManagementMonths(anchor, 12 * years);
  return end;
}

// Basil rejects contradictory cancellation controls. Send exactly ONE control.
export function cancellationParameters(subscription: any, cycle: string, timestamp: number) {
  const end = Math.max(managementPeriodEnd(subscription), managementCommitmentEnd(subscription, cycle, timestamp) ?? 0);
  if (end <= timestamp) throw new Error('Échéance Stripe indisponible. Vérifiez le paiement puis réessayez.');
  return { cancel_at: end, proration_behavior: 'none' as const };
}

export function renewalParameters(subscription: any) {
  return subscription.cancel_at_period_end
    ? { cancel_at_period_end: false as const, proration_behavior: 'none' as const }
    : { cancel_at: '' as const, proration_behavior: 'none' as const };
}

function writableDiscount(discount: any): Record<string, string> {
  if (typeof discount === 'string') return { discount };
  for (const key of ['discount', 'coupon', 'promotion_code']) {
    if (discount[key]) return { [key]: typeof discount[key] === 'string' ? discount[key] : discount[key].id };
  }
  if (discount.id) return { discount: discount.id };
  throw new Error('Calendrier Stripe indisponible. Vérifiez le paiement puis réessayez.');
}

// Keep the actual current phase, rather than recreating it from a stale subscription.
// Only API-writable phase attributes are copied; returned Stripe objects are never reposted.
export function planChangeParameters(schedule: any, subscription: any, nextPriceId: string, nextCycle: BillingCycle, effectiveAt: number, metadata: Record<string, string>) {
  const start = schedule.current_phase?.start_date;
  const phase = schedule.phases?.find((entry: any) => entry.start_date === start);
  if (schedule.status !== 'active' || !Number.isInteger(start) || !phase || !Number.isInteger(effectiveAt) || effectiveAt <= start) {
    throw new Error('Calendrier Stripe indisponible. Vérifiez le paiement puis réessayez.');
  }
  const current: Record<string, any> = {
    start_date: start, end_date: effectiveAt,
    items: phase.items.map((item: any) => ({
      price: typeof item.price === 'string' ? item.price : item.price.id,
      quantity: item.quantity ?? 1,
      ...(item.tax_rates?.length ? { tax_rates: item.tax_rates.map((rate: any) => typeof rate === 'string' ? rate : rate.id) } : {}),
      ...(item.discounts?.length ? { discounts: item.discounts.map(writableDiscount) } : {}),
    })),
    proration_behavior: 'none', metadata: { ...subscription.metadata, ...phase.metadata },
  };
  for (const key of ['collection_method', 'billing_cycle_anchor', 'description', 'application_fee_percent']) {
    if (phase[key] != null) current[key] = phase[key];
  }
  if (phase.default_payment_method) current.default_payment_method = typeof phase.default_payment_method === 'string' ? phase.default_payment_method : phase.default_payment_method.id;
  if (phase.default_tax_rates?.length) current.default_tax_rates = phase.default_tax_rates.map((rate: any) => typeof rate === 'string' ? rate : rate.id);
  if (phase.discounts?.length) current.discounts = phase.discounts.map(writableDiscount);
  if (phase.automatic_tax) current.automatic_tax = { enabled: phase.automatic_tax.enabled };
  if (phase.trial_end && phase.trial_end > start) current.trial_end = phase.trial_end;
  return {
    end_behavior: 'release' as const, proration_behavior: 'none' as const,
    phases: [current, {
      // Stripe derives the start from the previous phase, without changing its start date.
      duration: { interval: nextCycle === 'annual' ? 'year' as const : 'month' as const, interval_count: nextCycle === 'annual_monthly' ? 12 : 1 },
      items: [{ price: nextPriceId, quantity: 1 }], proration_behavior: 'none' as const,
      billing_cycle_anchor: 'phase_start' as const,
      metadata: { ...metadata, appletics_commitment_start: String(effectiveAt) },
    }],
  };
}

export function safeStripeDiagnostic(error: any): string {
  return String(error?.raw?.message ?? error?.message ?? 'Unknown Stripe error')
    .replace(/(?:sk|rk|pk)_(?:test|live)_[a-zA-Z0-9]+/g, '[redacted]')
    .replace(/[a-zA-Z0-9_]+_secret_[a-zA-Z0-9_]+/g, '[redacted]')
    .replace(/\b(?:cus|sub|sub_sched|pm|pi|seti|in|si)_[a-zA-Z0-9]+\b/g, '[object]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]')
    .replace(/[\r\n]+/g, ' ').slice(0, 150);
}
