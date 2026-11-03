import type { BillingPaymentSheet, BillingPaymentSheetOutcome } from '@/types/billing';
// Separate web implementation: never import or initialize a native Stripe module in Live Preview.
export async function ensureBillingPaymentSheetAvailable(): Promise<void> {
  throw new Error('La fenêtre native Stripe est disponible sur iOS et Android. Dans l’aperçu web, utilisez le paiement sur Stripe.');
}
export async function presentBillingPaymentSheet(_payment: BillingPaymentSheet): Promise<BillingPaymentSheetOutcome> {
  return { status: 'failed', error: 'La fenêtre native Stripe est disponible sur iOS et Android. Dans l’aperçu web, utilisez le paiement sur Stripe.' };
}
export async function handleBillingPaymentSheetReturn(_url: string): Promise<boolean> { return false; }
