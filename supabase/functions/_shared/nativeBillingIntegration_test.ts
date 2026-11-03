// Source-contract regressions. Run locally with:
// deno test --allow-read supabase/functions/_shared/nativeBillingIntegration_test.ts
// These tests do not call Stripe, read environment secrets, or simulate successful payments.
function assert(value: boolean, message: string): asserts value { if (!value) throw new Error(message); }
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path, root));

Deno.test('native subscription preparation remains authenticated, test-only, and server-priced', async () => {
  const server = await read('supabase/functions/appletics-billing/index.ts');
  const authAt = server.indexOf('admin.auth.getUser(token)');
  const sheetAt = server.indexOf("if (action === 'payment-sheet') {");
  assert(authAt > 0 && sheetAt > authAt, 'Native preparation must follow verified authentication.');
  assert(server.includes('/^(sk|rk)_test_/'), 'Privileged live keys remain blocked.');
  assert(server.includes('/^pk_test_[a-zA-Z0-9]+$/'), 'Native SDK requires a public test key.');
  assert(server.includes('invoice.amount_due !== selected.amount') && server.includes("invoice.currency !== 'chf'"), 'Initial invoice must match the server catalog in CHF.');
  assert(server.includes("payment_behavior: 'default_incomplete'") && server.includes("expand: ['latest_invoice.confirmation_secret']"), 'Native preparation must use a pending subscription and the Basil confirmation secret.');
});
Deno.test('native SDK has no privileged keys or persistence and web never imports it', async () => {
  const [client, web] = await Promise.all([read('services/billingPaymentSheetService.ts'), read('services/billingPaymentSheetService.web.ts')]);
  assert(client.includes('sdk.initPaymentSheet(') && client.includes('sdk.presentPaymentSheet()'), 'Native flow uses the real Stripe SDK.');
  assert(!client.includes('STRIPE_SECRET_KEY') && !client.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Client cannot reference privileged keys.');
  assert(!client.includes('AsyncStorage') && !client.includes('SecureStore') && !client.includes('console.log'), 'Session credentials cannot be persisted or logged.');
  assert(!web.includes("from '@stripe/stripe-react-native'") && !web.includes("import('@stripe/stripe-react-native')"), 'Web does not load native SDK code.');
});
Deno.test('shared lease covers payment and plan management; confirmed payments cannot be discarded', async () => {
  const [server, context] = await Promise.all([read('supabase/functions/appletics-billing/index.ts'), read('contexts/BillingContext.tsx')]);
  assert(server.includes("const paymentActions = ['checkout', 'payment-sheet', 'discard-payment']") && server.includes("const managementActions = ['change', 'cancel', 'resume']"), 'Every payment or management write shares the lease.');
  assert(server.includes('paymentActions.includes(action) || managementActions.includes(action)'), 'The lease must be acquired for both action families.');
  assert(server.includes("admin.rpc('acquire_billing_test_payment_lock'") && server.includes("paymentLease.admin.rpc('release_billing_test_payment_lock'"), 'Lease must be acquired and released.');
  assert(server.includes("['processing', 'succeeded'].includes(intent.status)"), 'Discard preserves confirmed or processing payments.');
  assert(context.includes('await presentBillingPaymentSheet(prepared.data)') && context.includes('await refresh(true);'), 'SDK completion is followed by server verification.');
  assert(!context.includes('setState(prepared.data)'), 'SDK credentials cannot become billing state.');
});
Deno.test('released schedule creation is not replayed and background polling cannot race writes', async () => {
  const [server, context, ui] = await Promise.all([read('supabase/functions/appletics-billing/index.ts'), read('contexts/BillingContext.tsx'), read('components/feature/BillingPaymentActions.tsx')]);
  assert(server.includes('schedule:v2:${sub.id}:${paymentLease!.token}'), 'New schedule creation must not replay a released schedule from an old idempotency key.');
  assert(server.includes('if (!hadSchedule)') && server.includes('stripe.subscriptionSchedules.release(schedule.id)'), 'A failed new schedule is detached without cancelling the paid subscription.');
  assert(context.includes('operation.current && !duringOperation'), 'Background refresh waits for the confirmed operation response.');
  assert(ui.includes('Changement déjà programmé') && ui.includes('actions.state.pendingChangeAt'), 'The confirmed scheduled plan and date must be visible without opening test help.');
});
