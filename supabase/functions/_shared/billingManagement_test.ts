// Pure request-planning regressions; no Stripe requests or credentials.
// Run: deno test supabase/functions/_shared/billingManagement_test.ts
import { addManagementMonths, managementPeriodEnd, managementCommitmentEnd, cancellationParameters, renewalParameters, planChangeParameters, safeStripeDiagnostic } from './billingManagement.ts';
import { billingCatalog } from './billingCatalog.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const seconds = (value: string) => Date.parse(value) / 1000;
const start = seconds('2026-10-25T14:19:58Z');
const end = seconds('2026-11-25T14:19:58Z');
const commitment = seconds('2027-10-25T14:19:58Z');
function subscription() {
  return { id: 'sub_fixture', start_date: start, metadata: { app: 'appletics_test', user_id: 'fixture', paymentFlow: 'payment_sheet_v1' }, cancel_at: null, cancel_at_period_end: false, items: { data: [{ current_period_start: start, current_period_end: end, price: { id: billingCatalog.pro.annual_monthly.priceId }, quantity: 1 }] } };
}
function schedule() {
  return { status: 'active', current_phase: { start_date: start, end_date: end }, phases: [{ start_date: start, end_date: end, items: [{ price: billingCatalog.pro.annual_monthly.priceId, quantity: 1 }], metadata: { source: 'fixture' }, default_payment_method: { id: 'pm_fixture' }, collection_method: 'charge_automatically' }] };
}
Deno.test('Basil cancellation sends one control and respects every paid commitment', () => {
  const monthly = cancellationParameters(subscription(), 'monthly', start + 1);
  const annualMonthly = cancellationParameters(subscription(), 'annual_monthly', start + 1);
  assert(monthly.cancel_at === end, 'Monthly cancellation must preserve the paid month.');
  assert(annualMonthly.cancel_at === commitment, 'Twelve-month monthly commitment must be preserved.');
  assert(!('cancel_at_period_end' in monthly) && !('cancel_at_period_end' in annualMonthly), 'Do not send conflicting cancellation controls.');
  assert(monthly.proration_behavior === 'none', 'Cancellation must not invoice immediate prorations.');
  const annual = subscription(); annual.items.data[0].current_period_end = commitment;
  assert(cancellationParameters(annual, 'annual', start + 1).cancel_at === commitment, 'Annual cancellation must preserve the paid year.');
});
Deno.test('renewal clears the existing control without contradictory parameters', () => {
  const timestampCancellation = renewalParameters({ cancel_at: commitment, cancel_at_period_end: false });
  const periodCancellation = renewalParameters({ cancel_at: end, cancel_at_period_end: true });
  assert(timestampCancellation.cancel_at === '' && !('cancel_at_period_end' in timestampCancellation), 'Timestamp cancellation must be cleared alone.');
  assert(periodCancellation.cancel_at_period_end === false && !('cancel_at' in periodCancellation), 'Period-end cancellation must be cleared alone.');
});
Deno.test('upgrade and downgrade reuse the actual current phase and fixed server prices', () => {
  for (const nextTier of ['basic', 'elite'] as const) {
    for (const nextCycle of ['monthly', 'annual_monthly', 'annual'] as const) {
      const nextPrice = billingCatalog[nextTier][nextCycle].priceId;
      const result = planChangeParameters(schedule(), subscription(), nextPrice, nextCycle, commitment, { app: 'appletics_test', user_id: 'fixture', tier: nextTier, billingCycle: nextCycle });
      const current = result.phases[0] as Record<string, any>;
      const future = result.phases[1] as Record<string, any>;
      assert(current.start_date === start && current.end_date === commitment, 'Do not move the current phase start or bypass the commitment.');
      assert(current.items[0].price === billingCatalog.pro.annual_monthly.priceId, 'Existing paid price must remain active until the boundary.');
      assert(current.default_payment_method === 'pm_fixture', 'Keep the existing payment method.');
      assert(future.items[0].price === nextPrice && future.items.length === 1, 'Replace the price, never add a second subscription item.');
      assert(!('start_date' in future) && !('end_date' in future), 'Let Stripe derive the future boundaries from the duration.');
      assert(future.duration.interval === (nextCycle === 'annual' ? 'year' : 'month'), 'Annual one-off and monthly commitments have different billing intervals.');
      assert(future.duration.interval_count === (nextCycle === 'annual_monthly' ? 12 : 1), 'The committed phase lasts twelve monthly intervals.');
      assert(future.metadata.appletics_commitment_start === String(commitment), 'Future commitment must use the change date.');
      assert(future.billing_cycle_anchor === 'phase_start' && result.end_behavior === 'release', 'Future billing must start at the boundary and continue after the schedule.');
      assert(result.proration_behavior === 'none' && current.proration_behavior === 'none' && future.proration_behavior === 'none', 'No immediate proration charges.');
    }
  }
});
Deno.test('phase discounts and an older real phase start are retained', () => {
  const oldStart = seconds('2026-09-25T14:19:58Z');
  const source: any = schedule(); source.current_phase.start_date = oldStart; source.phases[0].start_date = oldStart;
  source.phases[0].discounts = [{ coupon: 'coupon_fixture', discount: null, promotion_code: null }];
  const result = planChangeParameters(source, subscription(), billingCatalog.basic.monthly.priceId, 'monthly', commitment, {});
  const current = result.phases[0] as Record<string, any>;
  assert(current.start_date === oldStart, 'Use the actual schedule phase start, not the item period start.');
  assert(current.discounts[0].coupon === 'coupon_fixture', 'Discount API attributes must survive without undefined IDs.');
});
Deno.test('missing boundaries and released schedules fail closed before updating prices', () => {
  let caught = 0;
  try { managementPeriodEnd({ items: { data: [] } }); } catch { caught++; }
  try { planChangeParameters({ ...schedule(), status: 'released' }, subscription(), billingCatalog.basic.monthly.priceId, 'monthly', end, {}); } catch { caught++; }
  try { cancellationParameters(subscription(), 'monthly', end + 1); } catch { caught++; }
  assert(caught === 3, 'Invalid dates and released schedules cannot create invalid Stripe requests.');
});
Deno.test('calendar arithmetic handles month ends and renewed annual commitments', () => {
  assert(addManagementMonths(seconds('2026-01-31T12:00:00Z'), 1) === seconds('2026-02-28T12:00:00Z'), 'Clamp month-end without overflow.');
  assert(addManagementMonths(seconds('2028-02-29T12:00:00Z'), 12) === seconds('2029-02-28T12:00:00Z'), 'Clamp leap-day anniversaries.');
  assert(managementCommitmentEnd(subscription(), 'annual_monthly', commitment + 1) === seconds('2028-10-25T14:19:58Z'), 'Expired commitment rolls to its next annual anniversary.');
});
Deno.test('Stripe diagnostic text never contains fixture credentials or account identifiers', () => {
  const result = safeStripeDiagnostic({ raw: { message: 'Invalid request sk_test_fakeSecret pi_fixture_secret_fakeToken cus_fixture sub_sched_fixture user@example.ch' } });
  assert(!result.includes('fakeSecret') && !result.includes('fakeToken') && !result.includes('cus_fixture') && !result.includes('sub_sched_fixture') && !result.includes('user@example.ch'), 'Sensitive values must be masked.');
  assert(result.startsWith('Invalid request'), 'Keep the useful API reason.');
});
