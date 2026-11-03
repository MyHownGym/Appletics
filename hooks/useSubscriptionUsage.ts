import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useSubscription } from '@/hooks/useSubscription';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { quotaText } from '@/services/subscriptionOfferService';
export function useSubscriptionUsage() {
  const { athletes, trainingPlans, competitions } = useApp();
  const { coaches } = useClubCoaches();
  const subscription = useSubscription();
  const { config, isClub } = subscription;
  const entries = useMemo(() => [
    ...(isClub ? [{ id: 'coaches', label: 'Coachs', count: coaches.filter(coach => coach.status !== 'suspended').length, max: config.limits.coaches }] : []),
    { id: 'athletes', label: 'Athlètes', count: athletes.length, max: config.limits.athletes },
    { id: 'plans', label: 'Plans', count: trainingPlans.length, max: config.limits.trainingPlans },
    { id: 'competitions', label: 'Compétitions', count: competitions.length, max: config.limits.competitions },
  ].map(item => ({ ...item, display: `${item.count} / ${item.max === -1 ? '∞' : quotaText(item.max)}`, full: item.max !== -1 && item.count >= item.max })), [isClub, config, coaches, athletes.length, trainingPlans.length, competitions.length]);
  return { ...subscription, entries, currentName: isClub && config.track !== 'club' ? 'Aucune formule Club' : config.name };
}
