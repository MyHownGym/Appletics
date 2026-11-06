import type { SubscriptionTier } from '@/constants/subscription';
export type BillingCycle = 'monthly' | 'annual_monthly' | 'annual';
export const billingOptions: { id: BillingCycle; label: string; detail: string }[] = [
  { id: 'monthly', label: 'Mensuel', detail: 'Sans engagement' },
  { id: 'annual_monthly', label: '12 mois', detail: 'Paiement mensuel' },
  { id: 'annual', label: 'Annuel', detail: 'En une fois' },
];
// Existing prices are preserved; this catalogue does not connect payments.
export const subscriptionPrices: Record<SubscriptionTier, Record<BillingCycle, number>> = {
  basic: { monthly: 5.9, annual_monthly: 3.9, annual: 39 },
  pro: { monthly: 9.9, annual_monthly: 7.9, annual: 79 },
  elite: { monthly: 19.9, annual_monthly: 15.9, annual: 159 },
  club_basic: { monthly: 29.9, annual_monthly: 24.9, annual: 249 },
  club_pro: { monthly: 59.9, annual_monthly: 49.9, annual: 499 },
  club_elite: { monthly: 99.9, annual_monthly: 79.9, annual: 799 },
};
