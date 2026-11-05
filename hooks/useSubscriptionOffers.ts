import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useBilling } from '@/hooks/useBilling';
import { useApp } from '@/hooks/useApp';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionTier } from '@/constants/subscription';
import { BillingCycle } from '@/constants/subscriptionPricing';
import { getOfferPrice, getOfferRows } from '@/services/subscriptionOfferService';
import { formatBillingAmount } from '@/services/billingSummaryService';
import { useI18n } from '@/hooks/useI18n';
export function useSubscriptionOffers() {
  const { tier, reason, focusId } = useLocalSearchParams<{ tier?: string; reason?: string; focusId?: string }>();
  const { subscription, user } = useApp();
  const billingState = useBilling();
  const { t, locale } = useI18n();
  const { tiers, config, isClub, isAthlete } = useSubscription();

  const initial = tiers.find(plan => plan.id === tier)?.id ?? tiers.find(plan => plan.id === subscription)?.id ?? tiers[0].id;
  const [selected, setSelected] = useState<SubscriptionTier>(initial);
  const [billing, setBilling] = useState<BillingCycle>('annual_monthly');
  useEffect(() => { setSelected(initial); }, [initial, focusId]);
  const plan = tiers.find(item => item.id === selected) ?? tiers[0];
  const price = useMemo(() => {
    const offerPrice = getOfferPrice(plan, billing);
    return { ...offerPrice, amountText: formatBillingAmount(offerPrice.amount, locale) };
  }, [plan, billing, locale]);
  const rows = useMemo(() => getOfferRows(plan), [plan]);
  const isCurrent = billingState.state.subscribed && billingState.state.tier === plan.id && billingState.state.billingCycle === billing;
  const currentLabel = billingState.state.subscribed ? config.name : t('Accès local sans abonnement');
  const previousName = tiers[Math.max(0, tiers.indexOf(plan) - 1)].name;

  return { tiers, plan, selected, setSelected, billing, setBilling, price, rows, reason, focusId, isCurrent, currentLabel, previousName, isClub, isAthlete, user };
}
