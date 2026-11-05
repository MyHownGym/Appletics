import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';
export interface BillingState {
  subscribed: boolean;
  tier: SubscriptionTier | null;
  billingCycle: BillingCycle | null;
  status: string;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  commitmentEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pendingTier?: SubscriptionTier | null;
  pendingCycle?: BillingCycle | null;
  pendingChangeAt?: string | null;
  livemode: false;
  checkedAt: string | null;
}
export const emptyBillingState: BillingState = {
  subscribed: false, tier: null, billingCycle: null, status: 'inactive', subscriptionId: null,
  currentPeriodEnd: null, cancelAt: null, commitmentEnd: null, cancelAtPeriodEnd: false,
  livemode: false, checkedAt: null,
};
export interface BillingConfiguration {
  testMode: true;
  catalogReady: boolean;
  nativeReady?: boolean;
  nativeMessage?: string;
  message?: string;
}
// Session-scoped SDK credentials: never persist, log, or place in public configuration.
export interface BillingPaymentSheet {
  testMode: true;
  livemode: false;
  publishableKey: string;
  customerId: string;
  customerEphemeralKeySecret: string;
  paymentIntentClientSecret: string;
  subscriptionId: string;
  amount: number;
  currency: 'chf';
  merchantCountryCode: string;
  email: string;
}
export interface BillingPaymentSheetOutcome {
  status: 'completed' | 'cancelled' | 'failed';
  error: string | null;
}
export interface BillingResult<T> { data: T | null; error: string | null }
