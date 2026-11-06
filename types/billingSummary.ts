import type { BillingCycle } from '@/constants/subscriptionPricing';

export interface BillingReviewSummary {
  amount: number;
  cycle: BillingCycle;
  startsAt: Date | null;
  renewsAt: Date | null;
  changingPlan: boolean;
  estimated: boolean;
}
