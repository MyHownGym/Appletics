import { getSupabaseClient } from '@/template';
import { createDeferredAuthSubscription } from '@/services/authEventDispatchService';

const protectedAuthClients = new WeakSet<object>();

export function prepareAuthSessionDispatch(): void {
  const auth = getSupabaseClient().auth;
  if (protectedAuthClients.has(auth)) return;
  // Adapt the public subscription entry point BEFORE the existing AuthProvider mounts.
  // All consumers keep the same client, provider, storage and session exchange flow.
  // The template and SDK internals are not modified; no second client is created.
  auth.onAuthStateChange = createDeferredAuthSubscription(
    auth.onAuthStateChange.bind(auth),
    () => console.warn('Appletics: authentication listener failed; session access remains unconfirmed.'),
  );
  protectedAuthClients.add(auth);
}
