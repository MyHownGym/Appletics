import { subscriptionPrices, type BillingCycle } from '@/constants/subscriptionPricing';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingState } from '@/types/billing';
import type { BillingReviewSummary } from '@/types/billingSummary';

// Calendar arithmetic preserves the day where possible (31 Jan -> 28/29 Feb).
// The preview is an estimate, not a payment confirmation or an entitlement.
export function addBillingCalendarMonths(value: Date, months: number): Date {
  const date = new Date(value.getTime());
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getBillingReviewSummary(tier: SubscriptionTier, cycle: BillingCycle, state: BillingState, reviewedAt: Date): BillingReviewSummary {
  const changingPlan = !!state.subscriptionId && !['inactive', 'canceled', 'incomplete', 'incomplete_expired'].includes(state.status);
  const periodEnd = validDate(state.currentPeriodEnd);
  const commitmentEnd = validDate(state.commitmentEnd);
  // Matches the backend's effectiveAt = max(periodEnd, commitmentEnd).
  const startsAt = changingPlan
    ? periodEnd ? new Date(Math.max(periodEnd.getTime(), commitmentEnd?.getTime() ?? 0)) : null
    : new Date(reviewedAt.getTime());
  const resumingAttempt = state.status === 'incomplete' && state.tier === tier && state.billingCycle === cycle && !!periodEnd && periodEnd.getTime() > reviewedAt.getTime();
  return {
    amount: subscriptionPrices[tier][cycle], cycle, startsAt,
    renewsAt: resumingAttempt ? periodEnd : startsAt ? addBillingCalendarMonths(startsAt, cycle === 'annual' ? 12 : 1) : null,
    changingPlan, estimated: !resumingAttempt,
  };
}

export function formatBillingAmount(amount: number, locale: string): string {
  // Keep CHF explicit while applying the selected language's number formatting.
  return `CHF ${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}
