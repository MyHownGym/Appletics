// Source contracts only, not an iPhone test or a reproduction of Supabase session initialization.
// Run: deno test --allow-read supabase/functions/_shared/startupLoadingIntegration_test.ts
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path, root));
function assert(value: boolean, message: string): asserts value { if (!value) throw new Error(message); }

Deno.test('startup recovery is independent of auth initialization and preserves routing and providers', async () => {
  const [layout, index, recovery, provider] = await Promise.all([
    read('app/_layout.tsx'), read('app/index.tsx'), read('hooks/useStartupRecovery.ts'), read('contexts/StartupContext.tsx'),
  ]);
  assert(layout.indexOf('<AlertProvider>') < layout.indexOf('<SafeAreaProvider>'), 'Alerts remain outermost.');
  assert(layout.includes('<AuthProvider>') && layout.includes('<AppProvider>') && layout.includes('<Stack.Screen name="index"'), 'Keep auth, workspace and index route.');
  const shell = layout.slice(layout.indexOf('function StartupSession()'), layout.indexOf('export default function RootLayout'));
  assert(shell.indexOf('<StartupOverlay />') > shell.indexOf('</AuthProvider>'), 'Recovery must mount outside the pending auth provider.');
  assert(index.includes('loadingComponent={StartupLoadingScreen}') && index.includes('AuthRouter'), 'Keep AuthRouter and replace only its default loader.');
  assert(!layout.includes('<AuthRouter'), 'AuthRouter belongs only in index, not the root navigator.');
  assert(recovery.includes('SplashScreen.hideAsync()'), 'Hide the native splash when the React loading shell has laid out.');
  assert(provider.includes("status.phase === 'consent'"), 'Do not time out user consent.');
  assert(!provider.includes('signOut(') && !provider.includes('removeItem(') && !provider.includes('createClient('), 'Retry must preserve the client and storage.');
});

Deno.test('auth callback protection precedes provider mount without replacing authentication', async () => {
  const [layout, hook, service, billing, overlay] = await Promise.all([
    read('app/_layout.tsx'), read('hooks/useAuthStartup.ts'), read('services/authStartupService.ts'),
    read('contexts/BillingContext.tsx'), read('components/feature/StartupOverlay.tsx'),
  ]);
  assert(layout.includes('useAuthStartup()') && layout.includes('{prepared ? <AuthProvider>'), 'Prepare safe notifications before the existing AuthProvider mounts.');
  assert(hook.includes('prepareAuthSessionDispatch();') && hook.includes('[report, attempt]'), 'Initialize through the service and permit retries after initialization errors.');
  assert(service.includes('getSupabaseClient().auth') && service.includes('protectedAuthClients.has(auth)'), 'Adapt the same auth client once, not a new client per retry.');
  assert(!service.includes('createClient(') && !service.includes('setSession(') && !service.includes('signOut('), 'Do not fabricate sessions or erase a valid session.');
  assert(billing.includes('if (!authLoading) void checkConfiguration()'), 'Defer configuration reads until auth initialization finishes.');
  assert(overlay.indexOf('{startup.diagnostic}') < overlay.indexOf('{startup.blocked ? <>'), 'Show the build reference before the timeout, not just in an error.');
});

Deno.test('failed restoration cannot mark the account ready or overwrite its workspace', async () => {
  const [context, profile, service] = await Promise.all([read('contexts/AppContext.tsx'), read('services/accountProfileService.ts'), read('services/startupService.ts')]);
  assert(context.includes('withStartupDeadline(') && context.includes('setStartupError('), 'Bound reads and show a recoverable error.');
  assert(context.includes('stored.owner === authId && authId'), 'Keep identity-based access to local data.');
  const failure = context.slice(context.indexOf('void restore().catch'), context.indexOf('},[authId,auth.loading,onboardingLoading]'));
  assert(!failure.includes('setReadyFor(account.id)') && !failure.includes('saveLocalWorkspace('), 'A failed read must not grant access or save an empty replacement.');
  assert(!context.includes('await saveLocalWorkspace(account.id,workspaceData)'), 'Do not write before the restore has committed successfully.');
  assert(profile.includes('.abortSignal(controller.signal)') && profile.includes('finally { controller.abort(); }'), 'Abort the profile request once it completes or exceeds its deadline.');
  assert(service.includes('finally') && service.includes('clearTimeout(timer)'), 'Clean up read deadline timers.');
  const report = service.slice(service.indexOf('export function startupDiagnostic'), service.indexOf('export async function openStartupSupport'));
  assert(!report.includes('access_token') && !report.includes('email') && !report.includes('userId'), 'Support diagnostics exclude account data.');
});
