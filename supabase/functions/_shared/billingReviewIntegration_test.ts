// Source-contract checks for the compact review and deferred account UI.
// Run: deno test --allow-read supabase/functions/_shared/billingReviewIntegration_test.ts
// These checks do not call Stripe, read credentials, or claim device payment testing.
function assertReview(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path, root));

Deno.test('subscription page defers the account form and collapses technical details', async () => {
  const page = await read('app/upgrade.tsx');
  assertReview(!page.includes('BillingAccountForm'), 'The subscription page must not display a signup form before reviewing the purchase.');
  assertReview(page.includes('SubscriptionDisclosure title="Voir toutes les fonctionnalités"'), 'Full features must be collapsed by default.');
  assertReview(page.includes('SubscriptionDisclosure title="Aide et tests Stripe"'), 'Technical testing instructions must be collapsed by default.');
  assertReview(page.includes('BillingPaymentActions'), 'The main payment action must remain available.');
});

Deno.test('review shows amount, interval and an honestly estimated renewal date before payment', async () => {
  const [sheet, hook, service] = await Promise.all([
    read('components/feature/BillingCheckoutReview.tsx'), read('hooks/useBillingReview.ts'), read('services/billingSummaryService.ts'),
  ]);
  assertReview(sheet.includes('review.amountLabel') && sheet.includes('review.cycleLabel') && sheet.includes('review.renewalLabel'), 'The review must show amount, interval and renewal date.');
  assertReview(sheet.includes('Prochain renouvellement (estimé)'), 'Unconfirmed dates must be explicitly marked as estimates.');
  assertReview(hook.includes('setReviewOpen(true)') && hook.includes('setReviewOpen(false)'), 'Review must open before confirmation and close before the SDK presentation.');
  assertReview(service.includes('Math.min(day, lastDay)'), 'Calendar estimates must clamp month-end dates.');
  assertReview(service.includes("cycle === 'annual' ? 12 : 1"), 'Only the annual one-off payment advances renewal by 12 months.');
  assertReview(service.includes('Math.max(periodEnd.getTime(), commitmentEnd?.getTime() ?? 0)'), 'Plan changes must match the server commitment boundary.');
  assertReview(!service.includes('setState') && !service.includes('createBilling'), 'A date estimate cannot activate an entitlement or initiate payment.');
});

Deno.test('existing account and multilingual review are preserved without automatic signup', async () => {
  const [sheet, hook, account, copy] = await Promise.all([
    read('components/feature/BillingCheckoutReview.tsx'), read('hooks/useBillingReview.ts'),
    read('hooks/useBillingAccount.ts'), read('constants/billingTranslations.ts'),
  ]);
  assertReview(sheet.includes('!actions.authenticated ? <BillingAccountForm checkout />'), 'Only a missing authenticated session should request an account.');
  assertReview(hook.includes('auth.loading') && hook.includes('!actions.authenticated'), 'Session restoration must be checked before asking for login or confirming payment.');
  assertReview(account.includes('initialRegister = false') && account.includes('useState(initialRegister)') && account.includes('auth.signInWithPassword'), 'Existing users must be able to log in instead of being forced to register again.');
  assertReview(copy.includes('Nächste Verlängerung (geschätzt)') && copy.includes('Prossimo rinnovo (stimato)'), 'German and Italian renewal copy must exist.');
  assertReview(copy.includes('Abrechnungsintervall') && copy.includes('Periodicità'), 'German and Italian billing-interval copy must exist.');
});
