import Stripe from 'https://esm.sh/stripe@18.5.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2?target=denonext';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

class DeletionError extends Error { constructor(message: string, public status = 400) { super(message); } }
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  let phase = 'authenticate';
  let lease: { admin: any; userId: string; token: string } | null = null;
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new DeletionError('Reconnectez-vous avant de supprimer votre compte.', 401);
    if (Number(req.headers.get('content-length') ?? '0') > 4096) throw new DeletionError('Requête trop volumineuse.', 413);
    const raw = await req.text();
    if (raw.length > 4096) throw new DeletionError('Requête trop volumineuse.', 413);
    let body: any;
    try { body = JSON.parse(raw); } catch { throw new DeletionError('Requête invalide.'); }
    if (!body || body.confirmation !== 'DELETE_APPLETICS' || typeof body.password !== 'string' || !body.password || body.password.length > 256) throw new DeletionError('Confirmez la suppression et saisissez votre mot de passe.');
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: identity, error: identityError } = await admin.auth.getUser(token);
    if (identityError || !identity.user?.email) throw new DeletionError('Session expirée. Reconnectez-vous.', 401);
    const user = identity.user;
    // Reauthenticate without changing the caller's client/session and without trusting any supplied user ID.
    const verifier = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: passwordError } = await verifier.auth.signInWithPassword({ email: user.email!, password: body.password });
    body.password = '';
    if (passwordError || verified.user?.id !== user.id) throw new DeletionError('Mot de passe incorrect. La suppression n’a pas été lancée.', 403);
    if (verified.session) {
      // Only close the temporary reauthentication session, not the user's other sessions yet.
      const { error: verifierLogoutError } = await verifier.auth.signOut({ scope: 'local' });
      if (verifierLogoutError) throw new DeletionError('Vérification indisponible. Réessayez.', 503);
    }
    const leaseToken = crypto.randomUUID();
    const { data: acquired, error: lockError } = await admin.rpc('acquire_billing_test_payment_lock', { p_user_id: user.id, p_token: leaseToken });
    if (lockError || !acquired) throw new DeletionError('Un paiement ou une modification est en cours. Patientez puis réessayez.', 409);
    lease = { admin, userId: user.id, token: leaseToken };
    phase = 'billing';
    // The configured secret key decides the billing mode (sk_test_ = test, sk_live_ = real payments).
    const key = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const LIVE = /^(sk|rk)_live_/.test(key);
    const appId = LIVE ? 'appletics' : 'appletics_test';
    const { data: mapping, error: mappingError } = await admin.from(LIVE ? 'billing_live_accounts' : 'billing_test_accounts').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (mappingError) throw new DeletionError('Impossible de vérifier la facturation. Aucune donnée locale supprimée.', 503);
    if (mapping?.stripe_customer_id) {
      if (!LIVE && !/^(sk|rk)_test_/.test(key)) throw new DeletionError('Impossible de clôturer la facturation. Configurez la clé Stripe côté serveur.', 409);
      const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil', httpClient: Stripe.createFetchHttpClient() });
      const customer = await stripe.customers.retrieve(mapping.stripe_customer_id);
      if (!customer.deleted) {
        if (customer.livemode !== LIVE || customer.metadata.app !== appId || customer.metadata.user_id !== user.id) throw new DeletionError('Compte de facturation incompatible. Aucune suppression effectuée.', 409);
        // Deleting the verified customer cancels its subscriptions immediately (no further charges).
        const removed = await stripe.customers.del(customer.id);
        if (!removed.deleted) throw new DeletionError('Clôture Stripe non confirmée. Réessayez.', 503);
      }
    }
    phase = 'erase-data';
    const { error: eraseError } = await admin.rpc('appletics_erase_account_data', { p_user_id: user.id });
    if (eraseError) throw new DeletionError('La suppression Cloud n’a pas abouti. Réessayez ; l’abonnement peut déjà être résilié.', 503);
    phase = 'erase-auth';
    // Irreversible auth deletion preserves only technical references required by other members' anonymous contributions.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, true);
    if (deleteError) throw new DeletionError('Les données personnelles sont effacées, mais la suppression de connexion doit être terminée. Réessayez avec le même compte.', 503);
    return jsonResponse({ deleted: true, retained: 'anonymous_shared_contributions' });
  } catch (reason) {
    // Never log request bodies, passwords, JWTs, Stripe/customer objects or full exception text.
    console.error('[appletics-delete-account] failed', { phase, controlled: reason instanceof DeletionError });
    return jsonResponse({ error: reason instanceof DeletionError ? reason.message : 'Suppression indisponible. Réessayez ; aucune confirmation de suppression n’a été reçue.' }, reason instanceof DeletionError ? reason.status : 503);
  } finally {
    if (lease) {
      try { const { error } = await lease.admin.rpc('release_billing_test_payment_lock', { p_user_id: lease.userId, p_token: lease.token }); if (error) console.error('[appletics-delete-account] lease release failed'); }
      catch { console.error('[appletics-delete-account] lease release failed'); }
    }
  }
});
