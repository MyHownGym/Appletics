// Powered by OnSpace.AI
// v3 - athletes inherit coach plan (no upgrade gates for athletes)
import { useApp } from './useApp';
import { useBilling } from '@/hooks/useBilling';
import {
  SubscriptionTier, FeatureFlag, TierConfig,
  canUseFeature, checkLimit, getLimit, getTierConfig, getNextTier, INDIE_TIERS, CLUB_TIERS,
} from '@/constants/subscription';

export function useSubscription() {
  const { subscription, user } = useApp();
  const billing = useBilling();

  // Athletes see all features — their access depends on the coach's plan
  // They don't need their own subscription
  const isAthlete = user.userType === 'athlete';

  const config: TierConfig = getTierConfig(subscription);
  const isClub = user.accountType === 'club';

  // Athletes bypass all feature gates — they see everything available to their coach
  const hasFeature = (feature: FeatureFlag): boolean => {
    if (isAthlete) return true;
    return canUseFeature(subscription, feature);
  };

  const withinLimit = (limitKey: keyof TierConfig['limits'], currentCount: number): boolean => {
    if (isAthlete) return true;
    return checkLimit(subscription, limitKey, currentCount);
  };

  const getMaxLimit = (limitKey: keyof TierConfig['limits']): number => {
    if (isAthlete) return -1; // unlimited for athletes
    return getLimit(subscription, limitKey);
  };

  const nextTier = (): TierConfig | null => {
    if (isAthlete) return null;
    if (isClub && !subscription.startsWith('club_')) return getTierConfig('club_basic');
    return getNextTier(subscription);
  };

  const isTopTier = isAthlete ? true : isClub
    ? subscription === 'club_elite'
    : subscription === 'elite';

  const tiers = isClub ? CLUB_TIERS : INDIE_TIERS;

  return {
    subscription,
    subscribed: billing.state.subscribed,
    subscriptionLabel: billing.state.subscribed ? config.name : 'Accès local sans abonnement',
    config,
    isClub,
    isAthlete,
    tiers,
    hasFeature,
    withinLimit,
    getMaxLimit,
    nextTier,
    isTopTier,
  };
}
