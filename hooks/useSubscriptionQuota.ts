import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { TierConfig } from '@/constants/subscription';
const names: Record<keyof TierConfig['limits'], string> = { athletes: 'fiches athlètes', trainingPlans: 'plans enregistrés', competitions: 'compétitions enregistrées', channels: 'groupes de discussion', coaches: 'coachs', committeeMembers: 'membres du comité' };
export function useSubscriptionQuota() {
  const { withinLimit, config, tiers } = useSubscription();
  const router = useRouter();
  const { t } = useI18n();
  const { showAlert } = useAlert();
  return useCallback((key: keyof TierConfig['limits'], count: number): boolean => {
    if (withinLimit(key, count)) return true;
    const next = tiers.find(plan => (plan.limits[key] === -1 || plan.limits[key] > count) && plan.id !== config.id);
    const reason = `Limite ${config.name} atteinte : ${config.limits[key]} ${t(names[key])}. Vos données restent conservées et modifiables.`;
    showAlert('Quota atteint', reason, [
      { text: 'Fermer', style: 'cancel' },
      ...(next ? [{ text: 'Voir les formules', onPress: () => router.push({ pathname: '/upgrade', params: { tier: next.id, reason } }) }] : []),
    ]);
    return false;
  }, [withinLimit, config, tiers, router, showAlert]);
}
