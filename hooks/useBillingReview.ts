import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/template';
import { useBillingActions } from '@/hooks/useBillingActions';
import { useI18n } from '@/hooks/useI18n';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { formatBillingAmount, getBillingReviewSummary } from '@/services/billingSummaryService';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';

export function useBillingReview(tier: SubscriptionTier, cycle: BillingCycle, name: string) {
  const actions = useBillingActions(tier, cycle, name);
  const auth = useAuth();
  const { locale } = useI18n();
  const { translate } = useLocalizedCopy();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [method, setMethod] = useState<'native' | 'hosted'>('native');
  const [reviewedAt, setReviewedAt] = useState(0);
  const summary = useMemo(() => getBillingReviewSummary(tier, cycle, actions.state, new Date(reviewedAt)), [tier, cycle, actions.state, reviewedAt]);
  const amountLabel = useMemo(() => formatBillingAmount(summary.amount, locale), [summary.amount, locale]);
  const cycleLabel = translate(cycle === 'annual' ? 'Annuelle · en une fois' : cycle === 'annual_monthly' ? 'Mensuelle · engagement 12 mois' : 'Mensuelle · sans engagement');
  const dateLabel = useCallback((date: Date | null) => date ? date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : translate('À confirmer par Stripe'), [locale, translate]);
  const effectiveMethod = actions.nativePayment && actions.configuration?.nativeReady !== false ? method : 'hosted';
  const selectedPending = actions.hasPendingPayment && actions.state.tier === tier && actions.state.billingCycle === cycle;
  const incompatiblePending = actions.hasPendingPayment && (!selectedPending || effectiveMethod === 'hosted');
  const blockedChange = actions.hasSubscription && (actions.state.status !== 'active' || actions.cancellationScheduled || !summary.startsAt);
  const confirmationDisabled = auth.loading || !actions.authenticated || actions.loading || actions.busy || !actions.configuration?.catalogReady || !actions.accepted || actions.current || incompatiblePending || blockedChange;
  const openReview = useCallback(() => {
    if (actions.current || actions.busy || auth.loading) return;
    actions.setAccepted(false);
    setReviewedAt(Date.now());
    setMethod(actions.configuration?.nativeReady === false ? 'hosted' : 'native');
    setReviewOpen(true);
  }, [actions.current, actions.busy, actions.configuration?.nativeReady, actions.setAccepted, auth.loading]);
  const closeReview = useCallback(() => { if (!actions.busy) setReviewOpen(false); }, [actions.busy]);
  const confirmReview = useCallback(() => {
    if (confirmationDisabled) return;
    // Dismiss our review before presenting the SDK's real native payment window.
    setReviewOpen(false);
    if (effectiveMethod === 'hosted' && !actions.hasSubscription) actions.subscribeHosted();
    else actions.subscribe();
  }, [confirmationDisabled, effectiveMethod, actions.hasSubscription, actions.subscribeHosted, actions.subscribe]);
  const toggleManagement = useCallback(() => setManagementOpen(value => !value), []);
  return {
    actions, reviewOpen, managementOpen, toggleManagement, method: effectiveMethod, setMethod,
    openReview, closeReview, confirmReview, confirmationDisabled, incompatiblePending, blockedChange,
    accountLoading: auth.loading, accountEmail: auth.user?.email ?? '', summary, amountLabel, cycleLabel,
    renewalLabel: dateLabel(summary.renewsAt), startLabel: dateLabel(summary.startsAt),
  };
}
