import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { BILLING_HOSTED_RETURN_SCHEME } from '@/constants/billing';
import { isBillingReturnUrl, billingReturnWasCancelled } from '@/services/billingCallbackService';
import { assertExternalBillingAllowed } from '@/services/releasePolicyService';
export type BillingBrowserReturnMode = 'ios-session' | 'android-app' | 'preview' | 'web';
export interface BillingBrowserOutcome { status: 'returned' | 'closed' | 'opened'; cancelled?: boolean }
let authSessionOpen = false;
export function getBillingBrowserReturnMode(): BillingBrowserReturnMode {
  if (Platform.OS === 'web') return 'web';
  // iOS intercepts the callback in ASWebAuthenticationSession, rather than asking Safari to launch another app.
  if (Platform.OS === 'ios') return 'ios-session';
  const packageName = Constants.expoConfig?.android?.package;
  // Never assume OnSpace/Expo Go has the schemes of the app being previewed.
  if (Platform.OS === 'android' && packageName && Application.applicationId === packageName) return 'android-app';
  return 'preview';
}
export function dismissBillingBrowser() {
  if (Platform.OS === 'web' || authSessionOpen) return;
  try { void WebBrowser.dismissBrowser().catch(() => {}); } catch { /* Unsupported on Android; its custom tab closes via the callback. */ }
}
export async function openBillingBrowser(url: string): Promise<BillingBrowserOutcome> {
  assertExternalBillingAllowed();
  if (!/^https:\/\/(checkout\.stripe\.com|billing\.stripe\.com)\//.test(url)) throw new Error('Adresse de paiement Stripe invalide.');
  const mode = getBillingBrowserReturnMode();
  if (mode === 'web') { await Linking.openURL(url); return { status: 'opened' }; }
  if (mode === 'ios-session' || mode === 'android-app') {
    authSessionOpen = true;
    try {
      const outcome = await WebBrowser.openAuthSessionAsync(url, BILLING_HOSTED_RETURN_SCHEME);
      if (outcome.type === 'success' && outcome.url && isBillingReturnUrl(outcome.url)) {
        return { status: 'returned', cancelled: billingReturnWasCancelled(outcome.url) };
      }
      // Closing a browser is not proof of a cancelled payment; the caller must still query Stripe.
      return { status: 'closed' };
    } finally { authSessionOpen = false; }
  }
  await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  return { status: 'closed' };
}
