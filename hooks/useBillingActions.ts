import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useBilling } from '@/hooks/useBilling';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { useI18n } from '@/hooks/useI18n';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';
export function useBillingActions(tier: SubscriptionTier, cycle: BillingCycle, name: string) {
  const billing = useBilling();
  const { showAlert } = useLocalizedAlert();
  const { locale } = useI18n();
  const [accepted, setAccepted] = useState(false);
  const current = billing.state.subscribed && billing.state.tier === tier && billing.state.billingCycle === cycle;
  const hasSubscription = !!billing.state.subscriptionId && !['inactive', 'canceled', 'incomplete', 'incomplete_expired'].includes(billing.state.status);
  const hasPendingPayment = billing.state.status === 'incomplete' && !!billing.state.subscriptionId;
  const nativePayment = Platform.OS !== 'web';
  const cancellationScheduled = !!billing.state.cancelAt || billing.state.cancelAtPeriodEnd;
  const formatDate = useCallback((value: string | null) => value ? new Date(value).toLocaleDateString(locale) : '—', [locale]);
  const cancel = useCallback(() => {
    const end = billing.state.commitmentEnd ?? billing.state.currentPeriodEnd;
    showAlert('Programmer la résiliation ?', `L’accès est conservé jusqu’au ${formatDate(end)}. Les mensualités prévues durant l’engagement de 12 mois restent dues en mode test. Aucun paiement réel.`, [
      { text: 'Annuler', style: 'cancel' }, { text: 'Confirmer la résiliation', style: 'destructive', onPress: () => { void billing.cancel(); } },
    ]);
  }, [billing.cancel, billing.state.commitmentEnd, billing.state.currentPeriodEnd, showAlert, formatDate]);
  const subscribe = useCallback(() => {
    // The compact review is now the confirmation step; no duplicate dialog.
    if (!accepted || current || billing.busy || billing.loading || !billing.authenticated) return;
    if (hasSubscription) { void billing.changePlan(tier, cycle); }
    else { void billing.checkout(tier, cycle); }
  }, [accepted, current, hasSubscription, tier, cycle, billing.busy, billing.loading, billing.authenticated, billing.checkout, billing.changePlan]);
  const subscribeHosted = useCallback(() => {
    if (!accepted || current || hasSubscription || billing.busy || billing.loading || !billing.authenticated) return;
    void billing.checkoutHosted(tier, cycle);
  }, [accepted, current, hasSubscription, tier, cycle, billing.busy, billing.loading, billing.authenticated, billing.checkoutHosted]);
  const discardPending = useCallback(() => {
    showAlert('Abandonner le paiement en attente ?', 'Seul un essai natif non payé sera annulé. Un paiement déjà confirmé reste conservé.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Abandonner l’essai', style: 'destructive', onPress: () => { void billing.discardPendingPayment(); } },
    ]);
  }, [showAlert, billing.discardPendingPayment]);
  return { ...billing, accepted, setAccepted, current, hasSubscription, hasPendingPayment, nativePayment, cancellationScheduled, formatDate, requestCancel: cancel, subscribe, subscribeHosted, discardPending };
}
