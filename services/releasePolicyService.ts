import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

export interface ReleasePolicy { isBeta: boolean; externalBillingAllowed: boolean; version: string; build: string; }
export function getReleasePolicy(): ReleasePolicy {
  return {
    isBeta: Constants.expoConfig?.extra?.distribution === 'testflight',
    // Software subscriptions need a separately approved StoreKit/storefront implementation on iOS.
    // Fail closed for every iOS runtime, including preview and direct navigation into /upgrade.
    externalBillingAllowed: Platform.OS !== 'ios',
    version: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0',
    build: Application.nativeBuildVersion ?? 'preview',
  };
}
export function assertExternalBillingAllowed(): void {
  if (!getReleasePolicy().externalBillingAllowed) throw new Error('Les achats sont désactivés dans la bêta iOS. Aucun paiement ne sera lancé.');
}
