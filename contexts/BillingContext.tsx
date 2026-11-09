import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useAuth } from '@/template';
import { useI18n } from '@/hooks/useI18n';
import { BILLING_REFRESH_MS, BILLING_POST_CHECKOUT_REFRESH_MS, BILLING_RETURN_SCHEME } from '@/constants/billing';
import { emptyBillingState, type BillingState, type BillingConfiguration } from '@/types/billing';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';
import { getBillingConfiguration, checkBillingSubscription, createBillingCheckout, createBillingPortal, cancelBillingSubscription, resumeBillingSubscription, changeBillingSubscription, subscribeBillingSession, createBillingPaymentSheet, discardBillingPayment } from '@/services/billingService';
import { openBillingBrowser, dismissBillingBrowser } from '@/services/billingBrowserService';
import { isBillingReturnUrl, billingReturnWasCancelled } from '@/services/billingCallbackService';
import { ensureBillingPaymentSheetAvailable, presentBillingPaymentSheet, handleBillingPaymentSheetReturn } from '@/services/billingPaymentSheetService';

interface BillingContextValue {
  state: BillingState; configuration: BillingConfiguration | null; configurationError: string;
  error: string; message: string; loading: boolean; busy: boolean; pending: boolean; authenticated: boolean;
  refresh: () => Promise<void>; checkConfiguration: () => Promise<void>;
  checkout: (tier: SubscriptionTier, cycle: BillingCycle) => Promise<void>;
  checkoutHosted: (tier: SubscriptionTier, cycle: BillingCycle) => Promise<void>;
  discardPendingPayment: () => Promise<void>;
  changePlan: (tier: SubscriptionTier, cycle: BillingCycle) => Promise<void>;
  openPortal: () => Promise<void>; cancel: () => Promise<void>; resume: () => Promise<void>;
}
export const BillingContext = createContext<BillingContextValue | undefined>(undefined);
export function BillingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useI18n();
  const userId = user?.id ?? null;
  const currentId = useRef<string | null>(userId);
  currentId.current = userId;
  const [state, setState] = useState<BillingState>(emptyBillingState);
  const [configuration, setConfiguration] = useState<BillingConfiguration | null>(null);
  const [configurationError, setConfigurationError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingUntil, setPendingUntil] = useState(0);
  const returnUrl = useRef<string | null>(null);
  const alive = useRef(true);
  const inFlight = useRef<Promise<void> | null>(null);
  const operation = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    alive.current = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined') returnUrl.current = `${window.location.origin}/billing-return`;
    return () => { alive.current = false; };
  }, []);
  const checkConfiguration = useCallback(async () => {
    const result = await getBillingConfiguration();
    if (!alive.current) return;
    setConfiguration(result.data);
    setConfigurationError(result.error ?? '');
  }, []);
  // Do not compete with initial session restoration for the client's auth lock.
  // Stripe configuration is independent of startup readiness and never gates app access.
  useEffect(() => { if (!authLoading) void checkConfiguration(); }, [authLoading, checkConfiguration]);
  const refresh = useCallback(async (duringOperation = false) => {
    if (!userId || authLoading || (operation.current && !duringOperation)) return;
    if (inFlight.current) return inFlight.current;
    const version = generation.current;
    const task = (async () => {
      setLoading(true);
      const result = await checkBillingSubscription();
      if (!alive.current || currentId.current !== userId) return;
      if (version !== generation.current) { setLoading(false); return; }
      if (result.error || !result.data) {
        setError(result.error ?? 'Vérification impossible.');
        setState(emptyBillingState); // Fail closed; never grant access from a preview or a callback URL.
      } else {
        setState(result.data); setError('');
        if (result.data.subscribed) { setPendingUntil(0); setMessage('Abonnement confirmé par Stripe.'); }
      }
      setLoading(false);
    })();
    inFlight.current = task;
    try { await task; } finally { if (inFlight.current === task) inFlight.current = null; }
  }, [userId, authLoading]);
  useEffect(() => {
    generation.current += 1;
    inFlight.current = null;
    setState(emptyBillingState); setError(''); setMessage(''); setPendingUntil(0); setLoading(false);
    if (userId && !authLoading) void refresh();
  }, [userId, authLoading, refresh]);
  useEffect(() => subscribeBillingSession(() => { if (alive.current) void refresh(); }), [refresh]);
  useEffect(() => {
    if (!userId || authLoading) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' || Platform.OS === 'web') void refresh();
      if (pendingUntil && Date.now() >= pendingUntil) { setPendingUntil(0); setMessage('Aucune activation confirmée. Vérifiez le paiement ou relancez un essai.'); }
    }, pendingUntil ? BILLING_POST_CHECKOUT_REFRESH_MS : BILLING_REFRESH_MS);
    const listener = AppState.addEventListener('change', status => { if (status === 'active') void refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [userId, authLoading, pendingUntil, refresh]);
  useEffect(() => {
    const handle = async (url: string) => {
      if (!isBillingReturnUrl(url) || !alive.current) return;
      const startedFor = currentId.current;
      // Only PaymentSheet callbacks go to the native SDK. Hosted sessions have their own callback scheme.
      const nativeHandled = url.startsWith(BILLING_RETURN_SCHEME) ? await handleBillingPaymentSheetReturn(url) : false;
      if (!alive.current || currentId.current !== startedFor) return;
      if (!nativeHandled) dismissBillingBrowser();
      setMessage(billingReturnWasCancelled(url) ? 'Retour après annulation. Vérification du statut Stripe…' : 'Retour de Stripe. Vérification du paiement…');
      void refresh();
    };
    const listener = Linking.addEventListener('url', event => { void handle(event.url); });
    void Linking.getInitialURL().then(url => { if (url && alive.current) void handle(url); });
    const focus = () => { void refresh(); };
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.addEventListener('focus', focus);
    return () => { listener.remove(); if (Platform.OS === 'web' && typeof window !== 'undefined') window.removeEventListener('focus', focus); };
  }, [refresh]);
  const run = useCallback(async (work: () => Promise<void>) => {
    if (operation.current) return;
    const startedFor = currentId.current;
    generation.current += 1;
    inFlight.current = null;
    operation.current = true; setBusy(true); setLoading(false); setError(''); setMessage('');
    try { await work(); } catch (failure) {
      if (alive.current && startedFor === currentId.current) setError(failure instanceof Error ? failure.message : 'Opération Stripe indisponible.');
    } finally { operation.current = false; if (alive.current) setBusy(false); }
  }, []);
  const checkoutHosted = useCallback(async (tier: SubscriptionTier, cycle: BillingCycle) => run(async () => {
    const result = await createBillingCheckout(tier, cycle, returnUrl.current, language);
    if (result.error || !result.data) throw new Error(result.error ?? 'Paiement non disponible.');
    if (!alive.current || currentId.current !== userId) return;
    setPendingUntil(Date.now() + 180_000); setMessage('Paiement ouvert. L’accès sera activé après confirmation par Stripe.');
    const outcome = await openBillingBrowser(result.data.url);
    if (!alive.current || currentId.current !== userId) return;
    // iOS returns through the session promise, not necessarily a Linking event.
    setMessage(outcome.cancelled ? 'Retour après annulation. Vérification du statut Stripe…' : 'Retour de Stripe. Vérification du paiement…');
    await refresh(true);
  }), [run, refresh, userId, language]);
  const checkout = useCallback(async (tier: SubscriptionTier, cycle: BillingCycle) => {
    if (Platform.OS === 'web') return checkoutHosted(tier, cycle);
    return run(async () => {
      await ensureBillingPaymentSheetAvailable();
      const prepared = await createBillingPaymentSheet(tier, cycle);
      if (prepared.error || !prepared.data) throw new Error(prepared.error ?? 'Paiement non disponible.');
      if (!alive.current || currentId.current !== userId) return;
      // Credentials exist only in this call and in the native SDK, never in React state or storage.
      setPendingUntil(Date.now() + 180_000);
      setMessage('Fenêtre de paiement Stripe ouverte. L’accès sera activé après vérification du paiement.');
      const outcome = await presentBillingPaymentSheet(prepared.data);
      if (!alive.current || currentId.current !== userId) return;
      if (outcome.status === 'cancelled') {
        const discarded = await discardBillingPayment(prepared.data.subscriptionId);
        if (!alive.current || currentId.current !== userId) return;
        if (discarded.data) {
          setState(discarded.data); setPendingUntil(0);
          setMessage(discarded.data.subscribed ? 'Abonnement confirmé par Stripe.' : 'Paiement annulé. Aucun abonnement activé par ce retour.');
        } else {
          await refresh(true);
          if (alive.current && currentId.current === userId) setError(discarded.error ?? 'Vérifiez le paiement avant d’abandonner cet essai.');
        }
        return;
      }
      await refresh(true);
      if (outcome.error && alive.current && currentId.current === userId) setError(outcome.error);
    });
  }, [checkoutHosted, run, refresh, userId]);
  const discardPendingPayment = useCallback(async () => run(async () => {
    if (!state.subscriptionId || state.status !== 'incomplete') return;
    const result = await discardBillingPayment(state.subscriptionId);
    if (result.error || !result.data) throw new Error(result.error ?? 'Impossible d’abandonner cet essai.');
    if (!alive.current || currentId.current !== userId) return;
    setState(result.data); setPendingUntil(0);
    setMessage(result.data.subscribed ? 'Abonnement confirmé par Stripe.' : 'Essai de paiement abandonné. Vous pouvez choisir une formule.');
  }), [run, state.subscriptionId, state.status, userId]);
  const openPortal = useCallback(async () => run(async () => {
    const result = await createBillingPortal(returnUrl.current, language);
    if (result.error || !result.data) throw new Error(result.error ?? 'Portail indisponible.');
    if (currentId.current !== userId || !alive.current) return;
    await openBillingBrowser(result.data.url);
    if (currentId.current !== userId || !alive.current) return;
    await refresh(true);
  }), [run, refresh, userId, language]);
  const mutate = useCallback(async (action: 'cancel' | 'resume' | 'change', tier?: SubscriptionTier, cycle?: BillingCycle) => run(async () => {
    const result = action === 'cancel' ? await cancelBillingSubscription() : action === 'resume' ? await resumeBillingSubscription() : await changeBillingSubscription(tier!, cycle!);
    if (result.error || !result.data) {
      // Reconcile Stripe after a partial response failure; do not let polling silently erase the mutation error.
      await refresh(true);
      throw new Error(result.error ?? 'Modification indisponible.');
    }
    if (currentId.current !== userId || !alive.current) return;
    generation.current += 1;
    setState(result.data);
    setMessage(action === 'cancel' ? 'Résiliation programmée. Votre accès reste actif jusqu’à l’échéance affichée.' : action === 'resume' ? 'Renouvellement réactivé.' : 'Changement programmé à l’échéance affichée. Aucun paiement supplémentaire immédiat.');
  }), [run, userId]);
  const cancel = useCallback(() => mutate('cancel'), [mutate]);
  const resume = useCallback(() => mutate('resume'), [mutate]);
  const changePlan = useCallback((tier: SubscriptionTier, cycle: BillingCycle) => mutate('change', tier, cycle), [mutate]);
  return <BillingContext.Provider value={{ state, configuration, configurationError, error, message, loading, busy, pending: pendingUntil > 0, authenticated: !!userId, refresh, checkConfiguration, checkout, checkoutHosted, discardPendingPayment, changePlan, openPortal, cancel, resume }}>{children}</BillingContext.Provider>;
}
