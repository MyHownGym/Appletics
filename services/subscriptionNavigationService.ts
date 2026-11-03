import { CLUB_TIERS, getNextTier, SubscriptionTier, TierConfig } from '@/constants/subscription';

export function getHigherPlan(subscription: SubscriptionTier, isClub: boolean): TierConfig | null {
  if (!isClub) return getNextTier(subscription);
  const index = CLUB_TIERS.findIndex(tier => tier.id === subscription);
  return index < 0 ? CLUB_TIERS[0] : CLUB_TIERS[index + 1] ?? null;
}
