import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/template';
import { BILLING_FUNCTION } from '@/constants/billing';
import { getBillingBrowserReturnMode } from '@/services/billingBrowserService';
import { assertExternalBillingAllowed } from '@/services/releasePolicyService';
import type { Language } from '@/constants/i18n';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';
import type { BillingConfiguration, BillingResult, BillingState, BillingPaymentSheet } from '@/types/billing';

async function invokeBilling<T>(action: string, parameters: Record<string, unknown> = {}): Promise<BillingResult<T>> {
  try {
    if (action !== 'config' && action !== 'check') assertExternalBillingAllowed();
    const client = getSupabaseClient();
    const { data: session, error: sessionError } = await client.auth.getSession();
    if (sessionError) return { data: null, error: 'Session indisponible. Reconnectez-vous.' };
    if (action !== 'config' && !session.session) return { data: null, error: 'Connectez-vous pour tester les paiements.' };
    const { data, error } = await client.functions.invoke(BILLING_FUNCTION, {
      body: { action, ...parameters },
      ...(session.session ? { headers: { Authorization: `Bearer ${session.session.access_token}` } } : {}),
    });
    if (error) {
      let message = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context.text();
          try { message = JSON.parse(text).error ?? text; } catch { message = `[${error.context.status}] ${text || error.message}`; }
        } catch { message = error.message; }
      }
      return { data: null, error: message };
    }
    if (!data || data.error) return { data: null, error: data?.error ?? 'Réponse Stripe vide.' };
    // Mode is set by the server's Stripe key. Reject only inconsistent responses.
    if (typeof data.livemode === 'boolean' && typeof data.testMode === 'boolean' && data.livemode === data.testMode) return { data: null, error: 'Configuration Stripe incohérente. Réessayez plus tard.' };
    return { data: data as T, error: null };
  } catch (reason) { return { data: null, error: reason instanceof Error ? reason.message : 'Impossible de joindre Stripe. Vérifiez votre connexion puis réessayez.' }; }
}
// Avoid awaiting client methods inside Supabase auth callbacks; dispatch on the next tick.
export function subscribeBillingSession(onChange: () => void) {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const { data } = getSupabaseClient().auth.onAuthStateChange(() => {
    const timer = setTimeout(() => { timers.delete(timer); onChange(); }, 0);
    timers.add(timer);
  });
  return () => { data.subscription.unsubscribe(); timers.forEach(clearTimeout); timers.clear(); };
}
export function getBillingConfiguration() { return invokeBilling<BillingConfiguration>('config'); }
export function checkBillingSubscription() { return invokeBilling<BillingState>('check'); }
export function createBillingCheckout(tier: SubscriptionTier, billingCycle: BillingCycle, returnUrl: string | null, language: Language = 'fr') {
  return invokeBilling<{ url: string; testMode: boolean; sessionId: string }>('checkout', { tier, billingCycle, returnUrl, returnMode: getBillingBrowserReturnMode(), language });
}
export function createBillingPaymentSheet(tier: SubscriptionTier, billingCycle: BillingCycle) {
  return invokeBilling<BillingPaymentSheet>('payment-sheet', { tier, billingCycle });
}
export function discardBillingPayment(subscriptionId: string) {
  return invokeBilling<BillingState>('discard-payment', { subscriptionId });
}
export function createBillingPortal(returnUrl: string | null, language: Language = 'fr') { return invokeBilling<{ url: string; testMode: boolean }>('portal', { returnUrl, returnMode: getBillingBrowserReturnMode(), language }); }
export function cancelBillingSubscription() { return invokeBilling<BillingState>('cancel'); }
export function resumeBillingSubscription() { return invokeBilling<BillingState>('resume'); }
export function changeBillingSubscription(tier: SubscriptionTier, billingCycle: BillingCycle) { return invokeBilling<BillingState>('change', { tier, billingCycle }); }
