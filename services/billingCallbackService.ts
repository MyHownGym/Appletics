import { BILLING_HOSTED_RETURN_SCHEME, BILLING_RETURN_SCHEME } from '@/constants/billing';
export function isBillingReturnUrl(url: string): boolean {
  // Exact route boundary: billing-return-evil is not a valid callback.
  const base = url.split(/[?#]/)[0];
  return base === BILLING_HOSTED_RETURN_SCHEME || base === BILLING_RETURN_SCHEME;
}
export function billingReturnWasCancelled(url: string): boolean {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  return query.split('&').some(part => part === 'result=cancelled');
}
