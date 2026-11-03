// Run: deno test supabase/functions/_shared/authEventDispatch_test.ts
// Behavioral tests with a fake auth lock, not a TestFlight/device validation.
import { createDeferredAuthSubscription, type AuthEventListener } from '../../../services/authEventDispatchService.ts';

function assert(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));
function harness() {
  let listener: AuthEventListener<string, string | null> = () => {};
  let unsubscribes = 0;
  const register = (callback: AuthEventListener<string, string | null>) => {
    listener = callback;
    return { data: { subscription: { id: 'test', unsubscribe: () => { unsubscribes += 1; } } } };
  };
  return { register, emit: (event: string) => listener(event, null), unsubscribes: () => unsubscribes };
}

Deno.test('auth notification returns synchronously and permits a session read after lock release', async () => {
  const auth = harness();
  let locked = true;
  let called = false;
  let releaseRead: () => void = () => {};
  const read = new Promise<void>(resolve => { releaseRead = resolve; });
  const register = createDeferredAuthSubscription(auth.register, () => {});
  register(async () => {
    assert(!locked, 'Callback must start outside the auth lock.');
    await read;
    called = true;
  });
  const returned = auth.emit('INITIAL_SESSION');
  assert(returned === undefined, 'Do not return an async promise to the SDK.');
  assert(!called, 'Do not execute the listener synchronously.');
  locked = false;
  releaseRead();
  await tick();
  assert(called, 'Session reading must complete after the SDK releases its lock.');
});

Deno.test('async initial session and sign out are processed in delivery order', async () => {
  const auth = harness();
  const delivered: string[] = [];
  let finishInitial: () => void = () => {};
  const initial = new Promise<void>(resolve => { finishInitial = resolve; });
  createDeferredAuthSubscription(auth.register, () => {})(async event => {
    if (event === 'INITIAL_SESSION') await initial;
    delivered.push(event);
  });
  auth.emit('INITIAL_SESSION'); auth.emit('SIGNED_OUT');
  await tick();
  assert(delivered.length === 0, 'Sign out must not be overwritten by a late initial session callback.');
  finishInitial();
  await tick();
  assert(delivered.join(',') === 'INITIAL_SESSION,SIGNED_OUT', 'Maintain auth event ordering.');
});

Deno.test('unsubscribe clears deferred callbacks and retains the original subscription contract', async () => {
  const auth = harness(); let deliveries = 0;
  const registration = createDeferredAuthSubscription(auth.register, () => {})(() => { deliveries += 1; });
  assert(registration.data.subscription.id === 'test', 'Preserve SDK subscription fields.');
  auth.emit('INITIAL_SESSION');
  registration.data.subscription.unsubscribe(); registration.data.subscription.unsubscribe();
  await tick();
  assert(deliveries === 0 && auth.unsubscribes() === 1, 'Cleanup must be idempotent and cancel pending work.');
});

Deno.test('listener errors do not reject into the auth lock or stop later notifications', async () => {
  const auth = harness(); let errors = 0; let signedOut = false;
  createDeferredAuthSubscription(auth.register, () => { errors += 1; })(event => {
    if (event === 'INITIAL_SESSION') return Promise.reject(new Error('test failure'));
    signedOut = true;
  });
  auth.emit('INITIAL_SESSION'); auth.emit('SIGNED_OUT');
  await tick();
  assert(errors === 1 && signedOut, 'Report the failure without stranding subsequent auth events.');
});
