import { NativeModules, Platform } from 'react-native';
import { Colors, Radius } from '@/constants/theme';
import { BILLING_APPLE_MERCHANT_ID, BILLING_PAYMENT_SHEET_RETURN, BILLING_URL_SCHEME } from '@/constants/billing';
import type { BillingPaymentSheet, BillingPaymentSheetOutcome } from '@/types/billing';
import { assertExternalBillingAllowed } from '@/services/releasePolicyService';

let sdkPromise: Promise<typeof import('@stripe/stripe-react-native')> | null = null;
async function getSdk() {
  assertExternalBillingAllowed();
  if (Platform.OS === 'web' || !NativeModules.StripeSdk) {
    throw new Error('La fenêtre Stripe nécessite une version iOS ou Android intégrant le module Stripe. Utilisez le paiement sur Stripe ou un nouveau build.');
  }
  if (!sdkPromise) {
    sdkPromise = import('@stripe/stripe-react-native').catch(() => {
      sdkPromise = null;
      throw new Error('La fenêtre Stripe nécessite une version iOS ou Android intégrant le module Stripe. Utilisez le paiement sur Stripe ou un nouveau build.');
    });
  }
  return sdkPromise;
}
// Check native support before the server creates a pending subscription.
export async function ensureBillingPaymentSheetAvailable(): Promise<void> { await getSdk(); }

export async function presentBillingPaymentSheet(payment: BillingPaymentSheet): Promise<BillingPaymentSheetOutcome> {
  const expectedPrefix = payment.livemode ? 'pk_live_' : 'pk_test_';
  if (payment.testMode === payment.livemode || !payment.publishableKey.startsWith(expectedPrefix) || payment.currency !== 'chf') {
    return { status: 'failed', error: 'Configuration de paiement incohérente. Réessayez plus tard.' };
  }
  if (!payment.customerId || !payment.customerEphemeralKeySecret || !payment.paymentIntentClientSecret || payment.amount <= 0) {
    return { status: 'failed', error: 'Session de paiement native invalide. Réessayez.' };
  }
  try {
    const sdk = await getSdk();
    // Only Stripe's non-secret publishable key reaches initStripe; all privileged API calls are server-side.
    await sdk.initStripe({ publishableKey: payment.publishableKey, urlScheme: BILLING_URL_SCHEME, merchantIdentifier: BILLING_APPLE_MERCHANT_ID });
    const initialized = await sdk.initPaymentSheet({
      merchantDisplayName: 'Appletics',
      customerId: payment.customerId,
      customerEphemeralKeySecret: payment.customerEphemeralKeySecret,
      paymentIntentClientSecret: payment.paymentIntentClientSecret,
      returnURL: BILLING_PAYMENT_SHEET_RETURN,
      customFlow: false,
      style: 'alwaysLight',
      allowsDelayedPaymentMethods: false,
      defaultBillingDetails: { email: payment.email },
      ...(Platform.OS === 'ios' ? { applePay: { merchantCountryCode: payment.merchantCountryCode } } : {}),
      ...(Platform.OS === 'android' ? { googlePay: { merchantCountryCode: payment.merchantCountryCode, currencyCode: 'CHF', testEnv: true } } : {}),
      appearance: {
        colors: {
          primary: Colors.textPrimary,
          background: Colors.surface,
          componentBackground: Colors.surface,
          componentBorder: Colors.border,
          componentText: Colors.textPrimary,
          primaryText: Colors.textPrimary,
          secondaryText: Colors.textSecondary,
          placeholderText: Colors.textSecondary,
          error: Colors.error,
        },
        shapes: { borderRadius: Radius.lg },
        primaryButton: { colors: { background: Colors.textPrimary, text: Colors.textOnPrimary, border: Colors.textPrimary } },
      },
      // Keep Stripe's default button: it displays the verified amount and CHF, not a client-provided charge.
    });
    if (initialized.error) return { status: 'failed', error: 'Impossible de préparer la fenêtre Stripe. Vérifiez les clés de test du même compte et le build natif.' };
    const result = await sdk.presentPaymentSheet();
    if (result.error?.code === 'Canceled') return { status: 'cancelled', error: null };
    if (result.error) return { status: 'failed', error: 'Paiement non confirmé. Réessayez dans la fenêtre Stripe ou vérifiez le paiement.' };
    return { status: 'completed', error: null };
  } catch {
    return { status: 'failed', error: 'Impossible d’ouvrir la fenêtre Stripe. Utilisez le paiement sur Stripe ou vérifiez le build natif.' };
  }
}

export async function handleBillingPaymentSheetReturn(url: string): Promise<boolean> {
  if (!url.startsWith(BILLING_PAYMENT_SHEET_RETURN.split('?')[0]) || !NativeModules.StripeSdk) return false;
  try { return await (await getSdk()).handleURLCallback(url); } catch { return false; }
}
