// The mode (test or real payments) is decided by the server's Stripe key; see config.testMode.
export const BILLING_FUNCTION = 'appletics-billing';
export const BILLING_REFRESH_MS = 60_000;
export const BILLING_POST_CHECKOUT_REFRESH_MS = 10_000;
// Preserve the existing native PaymentSheet callback and isolate hosted Checkout from the preview host’s scheme.
export const BILLING_RETURN_SCHEME = 'onspaceapp://billing-return';
export const BILLING_HOSTED_RETURN_SCHEME = 'appletics://billing-return';
export const BILLING_PAYMENT_SHEET_RETURN = `${BILLING_RETURN_SCHEME}?source=payment-sheet`;
export const BILLING_URL_SCHEME = 'onspaceapp';
// This identifier is not a credential. Register it and its processing certificate with Apple before testing Apple Pay.
export const BILLING_APPLE_MERCHANT_ID = 'merchant.com.appletics.payments';
// Publishable configuration only. Secrets remain exclusively in Edge Function environment variables.
export const billingTestCards = [
  { number: '4242 4242 4242 4242', label: 'Paiement réussi' },
  { number: '4000 0025 0000 3155', label: 'Authentification 3D Secure' },
  { number: '4000 0000 0000 9995', label: 'Paiement refusé' },
];
