import Stripe from 'https://esm.sh/stripe@18.5.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2?target=denonext';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { activeCatalog, activateCatalog, getOffer, offerForPrice } from '../_shared/billingCatalog.ts';
import { addManagementMonths, managementPeriodEnd, managementCommitmentEnd, cancellationParameters, renewalParameters, planChangeParameters, safeStripeDiagnostic } from '../_shared/billingManagement.ts';
import { resolveBillingReturnUrl } from '../_shared/billingReturn.ts';

// denonext uses the runtime's native Node compatibility instead of old std/node event-loop shims.
class BillingError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const checkoutVersion = 'dynamic_methods_v2_return';
const nativePaymentVersion = 'payment_sheet_v1';
const nativeKeyMessage = 'Clé publiable Stripe manquante : configurez STRIPE_PUBLISHABLE_KEY (pk_test_… ou pk_live_…, du même compte et du même mode que la clé secrète) dans les secrets du serveur.';
const iso = (seconds: number | null | undefined) => seconds ? new Date(seconds * 1000).toISOString() : null;
const idOf = (value: any): string | null => typeof value === 'string' ? value : value?.id ?? null;
const now = () => Math.floor(Date.now() / 1000);
const periodEnd = managementPeriodEnd;
function commitmentEnd(sub: any, cycle: string) { return managementCommitmentEnd(sub, cycle, now()); }
function returnUrl(req: Request, candidate: unknown, mode: unknown, language: unknown) {
  return resolveBillingReturnUrl(Deno.env.get('SUPABASE_URL') ?? '', req.headers.get('origin'), candidate, mode, language);
}
let catalogCheck: Promise<boolean> | null = null;
async function checkCatalog(stripe: Stripe, live: boolean) {
  if (!catalogCheck) {
    catalogCheck = Promise.all(Object.values(activeCatalog()).flatMap(cycles => Object.entries(cycles).map(async ([cycle, offer]) => {
      const price = await stripe.prices.retrieve(offer.priceId);
      if (price.livemode !== live || !price.active || price.currency !== 'chf' || price.unit_amount !== offer.amount || price.recurring?.interval !== (cycle === 'annual' ? 'year' : 'month') || price.recurring?.interval_count !== 1) {
        throw new BillingError(live ? 'Catalogue Stripe live incompatible. Vérifiez les tarifs Appletics dans Stripe.' : 'Catalogue Stripe test incompatible. Vérifiez les tarifs dans le même compte test que la clé configurée.', 409);
      }
    }))).then(() => true).catch(error => { catalogCheck = null; throw error; });
  }
  return catalogCheck;
}

// Free plan granted by the owner to founding coaches: one row per e-mail in appletics_founder_access
// (tier basic / pro / elite / club_…, optional end date). Returned in the same shape as a Stripe subscription.
async function founderAccess(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth } = await admin.auth.getUser(token);
  const email = auth?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  const { data: row, error } = await admin.from('appletics_founder_access').select('tier, expires_at').eq('email', email).maybeSingle();
  if (error || !row) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (row.expires_at && row.expires_at < today) return null;
  const end = row.expires_at ? new Date(`${row.expires_at}T23:59:59Z`).toISOString() : null;
  return {
    subscribed: true, tier: row.tier, billingCycle: 'annual', status: 'founder', subscriptionId: null,
    currentPeriodEnd: end, cancelAt: end, commitmentEnd: null, cancelAtPeriodEnd: !!end,
    pendingTier: null, pendingCycle: null, pendingChangeAt: null, founder: true, checkedAt: new Date().toISOString(),
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  let action = 'unknown';
  let paymentLease: { admin: any; userId: string; token: string } | null = null;
  try {
    const body = await req.json().catch(() => { throw new BillingError('Requête invalide.'); });
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BillingError('Requête invalide.');
    action = body.action ?? 'check';
    if (!['config', 'check', 'checkout', 'payment-sheet', 'discard-payment', 'portal', 'cancel', 'resume', 'change'].includes(action)) throw new BillingError('Action inconnue.');
    // Founder access (table appletics_founder_access): the plan is granted without any payment.
    if (action === 'check') {
      const founder = await founderAccess(req);
      if (founder) return jsonResponse(founder);
    }
    const key = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    // The secret key decides the mode: sk_test_/rk_test_ = test payments, sk_live_/rk_live_ = real payments.
    const LIVE = /^(sk|rk)_live_/.test(key);
    if (!LIVE && !/^(sk|rk)_test_/.test(key)) throw new BillingError('Clé Stripe manquante : configurez STRIPE_SECRET_KEY (sk_test_… pour les essais, sk_live_… pour les vrais paiements) dans les secrets du serveur.', 409);
    const appId = LIVE ? 'appletics' : 'appletics_test';
    const accountsTable = LIVE ? 'billing_live_accounts' : 'billing_test_accounts';
    const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil', httpClient: Stripe.createFetchHttpClient() });
    await activateCatalog(stripe, LIVE);
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';
    const nativeReady = (LIVE ? /^pk_live_[a-zA-Z0-9]+$/ : /^pk_test_[a-zA-Z0-9]+$/).test(publishableKey);
    if (action === 'config') {
      await checkCatalog(stripe, LIVE);
      // No API key or temporary SDK credential in the public readiness response.
      return jsonResponse({ testMode: !LIVE, catalogReady: true, nativeReady, nativeMessage: nativeReady ? undefined : nativeKeyMessage });
    }
    if (action === 'payment-sheet' && !nativeReady) throw new BillingError(nativeKeyMessage, 409);
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false, autoRefreshToken: false } });
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new BillingError('Connectez-vous pour gérer votre abonnement.', 401);
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user?.email) throw new BillingError('Session expirée. Reconnectez-vous.', 401);
    const user = auth.user;
    const { data: profileState, error: profileStateError } = await admin.from('user_profiles').select('account_deleted_at').eq('id', user.id).maybeSingle();
    if (profileStateError) throw new BillingError('Impossible de vérifier le compte.', 503);
    if (!profileState || profileState.account_deleted_at) throw new BillingError('Ce compte a été supprimé. Aucun paiement ne peut être lancé.', 401);
    console.log('[appletics-billing]', { action, userId: user.id, live: LIVE });
    const paymentActions = ['checkout', 'payment-sheet', 'discard-payment'];
    const managementActions = ['change', 'cancel', 'resume'];
    if (paymentActions.includes(action) || managementActions.includes(action)) {
      const leaseToken = crypto.randomUUID();
      const { data: acquired, error: leaseError } = await admin.rpc('acquire_billing_test_payment_lock', { p_user_id: user.id, p_token: leaseToken });
      if (leaseError) throw new BillingError('Impossible de sécuriser le lancement du paiement. Réessayez.', 500);
      if (!acquired) throw new BillingError(managementActions.includes(action) ? 'Une modification est déjà en cours. Patientez puis réessayez.' : 'Un paiement est déjà en préparation. Patientez puis réessayez.', 409);
      paymentLease = { admin, userId: user.id, token: leaseToken };
    }
    const { data: mapping, error: mappingError } = await admin.from(accountsTable).select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (mappingError) throw new BillingError('Impossible de lire le compte de facturation.', 500);
    let customerId: string | null = mapping?.stripe_customer_id ?? null;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || customer.livemode !== LIVE || customer.metadata.app !== appId || customer.metadata.user_id !== user.id) throw new BillingError('Compte Stripe incompatible. Aucun accès accordé.', 409);
    }
    if (!customerId && ['checkout', 'payment-sheet'].includes(action)) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { app: appId, user_id: user.id } }, { idempotencyKey: `${appId}:customer:${user.id}` });
      if (customer.livemode !== LIVE) throw new BillingError('Client Stripe incompatible.', 409);
      customerId = customer.id;
      const { error } = await admin.from(accountsTable).upsert({ user_id: user.id, stripe_customer_id: customerId });
      if (error) throw new BillingError('Impossible de rattacher le client test à votre compte.', 500);
    }
    const allSubs = customerId ? await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 }) : { data: [] };
    const owned = allSubs.data.filter((entry: any) => entry.livemode === LIVE && entry.metadata.app === appId && entry.metadata.user_id === user.id && offerForPrice(entry.items.data[0]?.price.id ?? ''));
    let sub: any = owned.find((entry: any) => ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'].includes(entry.status)) ?? owned.sort((a: any, b: any) => b.created - a.created)[0] ?? null;
    if (sub && managementActions.includes(action)) {
      // Re-read after acquiring the lease: schedules and cancellation dates may have changed on another device.
      sub = await stripe.subscriptions.retrieve(sub.id);
      if (sub.livemode !== LIVE || idOf(sub.customer) !== customerId || sub.metadata.app !== appId || sub.metadata.user_id !== user.id || sub.items.data.length !== 1) throw new BillingError('Abonnement Stripe incompatible. Aucun changement effectué.', 409);
    }
    const offer = sub ? offerForPrice(sub.items.data[0].price.id) : null;
    const snapshot = async (subscription: any) => {
      const selected = subscription ? offerForPrice(subscription.items.data[0]?.price.id ?? '') : null;
      const end = subscription ? subscription.items.data[0]?.current_period_end ?? subscription.current_period_end ?? null : null;
      let pendingTier = null, pendingCycle = null, pendingChangeAt = null;
      if (subscription?.schedule) {
        const schedule = await stripe.subscriptionSchedules.retrieve(idOf(subscription.schedule)!);
        const future = schedule.status === 'active' ? schedule.phases.find((phase: any) => phase.start_date > now() && idOf(phase.items[0]?.price) !== selected?.priceId) : null;
        const pending = future ? offerForPrice(idOf(future.items[0]?.price) ?? '') : null;
        if (pending) { pendingTier = pending.tier; pendingCycle = pending.cycle; pendingChangeAt = iso(future.start_date); }
      }
      const result = {
        subscribed: !!selected && subscription?.status === 'active' && !!end && end > now() && !subscription.pause_collection,
        tier: selected?.tier ?? null, billingCycle: selected?.cycle ?? null,
        status: subscription?.status ?? 'inactive', subscriptionId: subscription?.id ?? null,
        currentPeriodEnd: iso(end), cancelAt: iso(subscription?.cancel_at),
        commitmentEnd: subscription && selected ? iso(commitmentEnd(subscription, selected.cycle)) : null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
        pendingTier, pendingCycle, pendingChangeAt, livemode: LIVE, checkedAt: new Date().toISOString(),
      };
      const { error } = await admin.from('billing_test_entitlements').upsert({
        user_id: user.id, tier: result.tier, billing_cycle: result.billingCycle, status: result.status,
        stripe_subscription_id: result.subscriptionId, current_period_end: result.currentPeriodEnd,
        cancel_at: result.cancelAt, commitment_end: result.commitmentEnd,
        cancel_at_period_end: result.cancelAtPeriodEnd, livemode: LIVE, checked_at: result.checkedAt,
      });
      if (error) throw new BillingError('Stripe vérifié, mais la sauvegarde du statut a échoué. Réessayez.', 500);
      return result;
    };
    if (action === 'check') return jsonResponse(await snapshot(sub));
    if (action === 'discard-payment') {
      const attempt = owned.find((entry: any) => entry.id === body.subscriptionId && entry.metadata.paymentFlow === nativePaymentVersion);
      if (!attempt) throw new BillingError('Aucun paiement natif en attente pour ce compte.', 409);
      const latest: any = await stripe.subscriptions.retrieve(attempt.id, { expand: ['latest_invoice.confirmation_secret'] });
      if (latest.status !== 'incomplete') return jsonResponse(await snapshot(latest));
      const secret = latest.latest_invoice?.confirmation_secret?.client_secret;
      if (!secret) throw new BillingError('Vérifiez le paiement avant d’abandonner cet essai.', 409);
      const intent = await stripe.paymentIntents.retrieve(secret.split('_secret_')[0]);
      if (idOf(intent.customer) !== customerId || intent.livemode !== LIVE) throw new BillingError('Paiement incompatible avec ce compte.', 409);
      if (['processing', 'succeeded'].includes(intent.status)) return jsonResponse(await snapshot(latest));
      // This only cancels an unpaid native first-invoice attempt, never a paid subscription.
      const cancelled = await stripe.subscriptions.cancel(latest.id, { invoice_now: false, prorate: false });
      return jsonResponse(await snapshot(cancelled));
    }
    if (action === 'payment-sheet') {
      await checkCatalog(stripe, LIVE);
      const selected = getOffer(body.tier, body.billingCycle);
      if (!selected) throw new BillingError('Formule ou périodicité invalide.');
      const activeAttempt = sub && !['canceled', 'incomplete_expired'].includes(sub.status);
      if (activeAttempt && (sub.status !== 'incomplete' || sub.metadata.paymentFlow !== nativePaymentVersion)) throw new BillingError('Vous avez déjà un abonnement ou un paiement en attente. Gérez-le avant de souscrire de nouveau.', 409);
      if (activeAttempt && sub.items.data[0].price.id !== selected.priceId) throw new BillingError('Terminez ou abandonnez le paiement en attente avant de choisir une autre formule.', 409);
      const account = await stripe.accounts.retrieve();
      const merchantCountryCode = account.country;
      if (!merchantCountryCode || !/^[A-Z]{2}$/.test(merchantCountryCode)) throw new BillingError('Pays du compte Stripe indisponible.', 409);
      const sessions = await stripe.checkout.sessions.list({ customer: customerId!, limit: 100 });
      for (const session of sessions.data) {
        if (session.status === 'open' && session.metadata?.app === appId && session.livemode === LIVE) await stripe.checkout.sessions.expire(session.id);
      }
      const metadata = { app: appId, user_id: user.id, tier: body.tier, billingCycle: body.billingCycle, paymentFlow: nativePaymentVersion };
      const nativeSub: any = activeAttempt
        ? await stripe.subscriptions.retrieve(sub.id, { expand: ['latest_invoice.confirmation_secret'] })
        : await stripe.subscriptions.create({
          customer: customerId!, items: [{ price: selected.priceId, quantity: 1 }], payment_behavior: 'default_incomplete',
          payment_settings: { payment_method_types: ['card', 'link'], save_default_payment_method: 'on_subscription' },
          metadata, expand: ['latest_invoice.confirmation_secret'],
        }, { idempotencyKey: `${appId}:${nativePaymentVersion}:${user.id}:${sub?.id ?? 'first'}` });
      const invoice = nativeSub.latest_invoice;
      if (nativeSub.livemode !== LIVE || idOf(nativeSub.customer) !== customerId || !invoice || invoice.livemode !== LIVE || invoice.currency !== 'chf' || invoice.amount_due !== selected.amount) throw new BillingError('Montant ou compte Stripe incompatible. Aucun accès accordé.', 409);
      const paymentIntentClientSecret = invoice.confirmation_secret?.client_secret;
      if (!paymentIntentClientSecret || nativeSub.status !== 'incomplete') throw new BillingError('Paiement déjà traité ou non disponible. Vérifiez le paiement dans l’app.', 409);
      const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerId! }, { apiVersion: '2025-08-27.basil' });
      if (!ephemeralKey.secret || ephemeralKey.livemode !== LIVE) throw new BillingError('Session temporaire Stripe indisponible.', 409);
      await snapshot(nativeSub);
      // pk_test is public by design. The SDK requires it; no privileged API key leaves this server.
      // Only the authenticated owner receives session-scoped credentials, with no-store headers.
      return jsonResponse({ testMode: !LIVE, livemode: LIVE, publishableKey, customerId, customerEphemeralKeySecret: ephemeralKey.secret, paymentIntentClientSecret, subscriptionId: nativeSub.id, amount: selected.amount, currency: 'chf', merchantCountryCode, email: user.email });
    }
    if (action === 'checkout') {
      await checkCatalog(stripe, LIVE);
      const selected = getOffer(body.tier, body.billingCycle);
      if (!selected) throw new BillingError('Formule ou périodicité invalide.');
      if (sub && !['canceled', 'incomplete_expired'].includes(sub.status)) {
        if (sub.status === 'incomplete' && sub.metadata.paymentFlow === nativePaymentVersion) throw new BillingError('Terminez ou abandonnez le paiement en attente avant de choisir une autre formule.', 409);
        if (sub.status === 'incomplete' && sub.items.data[0]?.price.id === selected.priceId) {
          const pendingSessions = await stripe.checkout.sessions.list({ customer: customerId!, limit: 100 });
          const pending = pendingSessions.data.find(session => session.status === 'open' && idOf(session.subscription) === sub.id && session.metadata?.app === appId && session.livemode === LIVE);
          if (pending?.url) return jsonResponse({ url: pending.url, sessionId: pending.id, testMode: !LIVE });
        }
        throw new BillingError('Vous avez déjà un abonnement ou un paiement en attente. Gérez-le avant de souscrire de nouveau.', 409);
      }
      const selectedPrice = await stripe.prices.retrieve(selected.priceId);
      if (selectedPrice.livemode !== LIVE || !selectedPrice.active || selectedPrice.unit_amount !== selected.amount || selectedPrice.currency !== 'chf') throw new BillingError('Tarif indisponible.', 409);
      const baseReturn = returnUrl(req, body.returnUrl, body.returnMode, body.language);
      const separator = baseReturn.includes('?') ? '&' : '?';
      const sessions = await stripe.checkout.sessions.list({ customer: customerId!, limit: 100 });
      const open = sessions.data.filter(session => session.status === 'open' && session.metadata?.app === appId);
      const matching = open.find(session => session.metadata?.tier === body.tier && session.metadata?.billingCycle === body.billingCycle && session.metadata?.checkoutVersion === checkoutVersion && session.success_url?.startsWith(`${baseReturn}${separator}`));
      if (matching?.url && matching.livemode === LIVE) return jsonResponse({ url: matching.url, sessionId: matching.id, testMode: !LIVE });
      for (const previous of open) await stripe.checkout.sessions.expire(previous.id);
      const metadata = { app: appId, user_id: user.id, tier: body.tier, billingCycle: body.billingCycle, checkoutVersion };
      const session = await stripe.checkout.sessions.create({
        // Dynamic methods support TWINT mandates plus eligible card wallets on hosted Checkout.
        customer: customerId!, client_reference_id: user.id, mode: 'subscription', line_items: [{ price: selected.priceId, quantity: 1 }], metadata,
        subscription_data: { metadata },
        success_url: `${baseReturn}${separator}result=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${baseReturn}${separator}result=cancelled`, expires_at: now() + 30 * 60,
        custom_text: { submit: { message: `${LIVE ? '' : 'MODE TEST (aucun débit réel) · '}${body.billingCycle === 'annual_monthly' ? 'Engagement renouvelable de 12 mois, facturé mensuellement. Résiliation à la fin des 12 mois.' : 'Renouvellement automatique. Résiliation à la fin de la période payée.'}` } },
        // Codes promo créés dans Stripe (ex. FONDATEUR -50 %) acceptés sur la page de paiement.
        allow_promotion_codes: true,
      }, { idempotencyKey: `${appId}:checkout:${checkoutVersion}:${user.id}:${paymentLease!.token}` });
      if (session.livemode !== LIVE || !session.url) throw new BillingError('Session Stripe non disponible.', 409);
      return jsonResponse({ url: session.url, sessionId: session.id, testMode: !LIVE });
    }
    if (!customerId) throw new BillingError('Aucun client Stripe test. Lancez un premier paiement.');
    if (action === 'portal') {
      const config = await stripe.billingPortal.configurations.create({
        business_profile: { headline: LIVE ? 'Appletics · gestion de votre abonnement' : 'Appletics · gestion des paiements de test' },
        features: { customer_update: { enabled: true, allowed_updates: ['name', 'address', 'phone'] }, invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: false }, subscription_update: { enabled: false } },
        metadata: { app: appId },
      }, { idempotencyKey: `${appId}:portal-config:v1:${Math.floor(now() / 86400)}` });
      const portal = await stripe.billingPortal.sessions.create({ customer: customerId, configuration: config.id, return_url: returnUrl(req, body.returnUrl, body.returnMode, body.language) });
      return jsonResponse({ url: portal.url, testMode: !LIVE });
    }
    if (!sub || !offer || !['active', 'past_due', 'unpaid', 'trialing'].includes(sub.status)) throw new BillingError('Aucun abonnement modifiable.');
    if (action === 'resume') {
      if (sub.schedule) {
        await stripe.subscriptionSchedules.release(idOf(sub.schedule)!);
        sub = await stripe.subscriptions.retrieve(sub.id);
      }
      const updated = await stripe.subscriptions.update(sub.id, renewalParameters(sub));
      return jsonResponse(await snapshot(updated));
    }
    if (action === 'cancel') {
      // Validate the commitment BEFORE detaching an existing plan-change schedule.
      const parameters = cancellationParameters(sub, offer.cycle, now());
      if (sub.schedule) {
        await stripe.subscriptionSchedules.release(idOf(sub.schedule)!);
        sub = await stripe.subscriptions.retrieve(sub.id);
      }
      const updated = await stripe.subscriptions.update(sub.id, parameters);
      return jsonResponse(await snapshot(updated));
    }
    if (action === 'change') {
      await checkCatalog(stripe, LIVE);
      const next = getOffer(body.tier, body.billingCycle);
      if (!next) throw new BillingError('Formule invalide.');
      if (sub.status !== 'active') throw new BillingError('Régularisez le paiement avant de changer de formule.');
      if (sub.cancel_at || sub.cancel_at_period_end) throw new BillingError('Réactivez le renouvellement avant de programmer un changement.');
      if (next.priceId === sub.items.data[0].price.id) throw new BillingError('Cette formule est déjà active.');
      if (body.timing === 'now') {
        // Immediate change: Stripe bills (or credits) the difference pro rata right away.
        const monthly = (amount: number, cycle: string) => cycle === 'annual' ? amount / 12 : amount;
        const downgrade = monthly(next.amount, body.billingCycle) < monthly(offer!.amount, offer!.cycle);
        const committed = (commitmentEnd(sub, offer!.cycle) ?? 0) > now();
        if (downgrade && committed) throw new BillingError('Pendant l’engagement de 12 mois, une formule inférieure s’applique à l’échéance. Choisissez « À la fin de mon abonnement ».');
        if (sub.schedule) await stripe.subscriptionSchedules.release(idOf(sub.schedule)!);
        const updated = await stripe.subscriptions.update(sub.id, {
          items: [{ id: sub.items.data[0].id, price: next.priceId }],
          proration_behavior: 'always_invoice',
          payment_behavior: 'error_if_incomplete',
          metadata: { ...sub.metadata, tier: body.tier, billingCycle: body.billingCycle },
        }, { idempotencyKey: `${appId}:change-now:v1:${paymentLease!.token}` });
        return jsonResponse(await snapshot(updated));
      }
      const effectiveAt = Math.max(periodEnd(sub), commitmentEnd(sub, offer.cycle) ?? 0);
      if (effectiveAt <= now()) throw new BillingError('Échéance Stripe indisponible. Vérifiez le paiement puis réessayez.', 409);
      const hadSchedule = !!sub.schedule;
      // Each lease represents one confirmed operation. Never reuse a released schedule from a cached creation key.
      const schedule: any = hadSchedule
        ? await stripe.subscriptionSchedules.retrieve(idOf(sub.schedule)!)
        : await stripe.subscriptionSchedules.create({ from_subscription: sub.id }, { idempotencyKey: `${appId}:schedule:v2:${sub.id}:${paymentLease!.token}` });
      if (schedule.livemode !== LIVE || idOf(schedule.customer) !== customerId || idOf(schedule.subscription) !== sub.id) throw new BillingError('Calendrier Stripe incompatible. Aucun changement effectué.', 409);
      try {
        const parameters = planChangeParameters(schedule, sub, next.priceId, body.billingCycle, effectiveAt, { app: appId, user_id: user.id, tier: body.tier, billingCycle: body.billingCycle });
        await stripe.subscriptionSchedules.update(schedule.id, parameters as Stripe.SubscriptionScheduleUpdateParams, { idempotencyKey: `${appId}:schedule-update:v2:${paymentLease!.token}` });
      } catch (failure) {
        // A failed first schedule update must not leave the paid subscription trapped in an empty schedule.
        // Never release a pre-existing schedule, because it may hold a previously confirmed change.
        if (!hadSchedule) {
          try { await stripe.subscriptionSchedules.release(schedule.id); }
          catch (cleanup) { console.error('[appletics-billing] schedule cleanup', safeStripeDiagnostic(cleanup)); }
        }
        throw failure;
      }
      return jsonResponse(await snapshot(await stripe.subscriptions.retrieve(sub.id)));
    }
    throw new BillingError('Action inconnue.');
  } catch (error) {
    const stripeFailure = String((error as any)?.type ?? '').startsWith('Stripe');
    const diagnostic = safeStripeDiagnostic(error);
    const planningError = !stripeFailure && error instanceof Error && /^(Échéance|Calendrier) Stripe indisponible/.test(error.message);
    const message = error instanceof BillingError || planningError ? (error as Error).message : stripeFailure ? `Stripe : ${diagnostic}` : 'Stripe : opération indisponible. Vérifiez la configuration de test ou réessayez.';
    console.error('[appletics-billing] failed', { action, errorType: (error as any)?.type ?? (error as any)?.name, code: (error as any)?.code ?? null, param: (error as any)?.param ?? null });
    // Redacted Stripe reason, not keys, customer objects, invoices, or complete SDK responses.
    if (stripeFailure) console.error('[appletics-billing] Stripe reason', diagnostic);
    const status = error instanceof BillingError ? error.status : planningError || (error as any)?.type === 'StripeInvalidRequestError' ? 409 : 502;
    return jsonResponse({ error: message }, status);
  } finally {
    if (paymentLease) {
      try {
        const { error: releaseError } = await paymentLease.admin.rpc('release_billing_test_payment_lock', { p_user_id: paymentLease.userId, p_token: paymentLease.token });
        if (releaseError) console.error('[appletics-billing] lease release failed');
      } catch { console.error('[appletics-billing] lease release failed'); }
    }
  }
});
