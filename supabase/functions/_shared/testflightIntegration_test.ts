// Source-contract tests only. These do not build/sign an IPA, call Stripe, delete an account or test a device.
// Run: deno test --allow-read supabase/functions/_shared/testflightIntegration_test.ts
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path, root));
function assert(value: boolean, message: string): asserts value { if (!value) throw new Error(message); }

Deno.test('TestFlight uses a store build and an owner-confirmed identifier', async () => {
  const [configSource, easSource, appSource] = await Promise.all([read('app.config.ts'), read('eas.json'), read('app.json')]);
  const eas = JSON.parse(easSource);
  const app = JSON.parse(appSource).expo;
  assert(eas.build.testflight.distribution === 'store' && eas.build.testflight.ios.simulator === false, 'Build an installable store IPA, not an ad-hoc or simulator archive.');
  assert(eas.cli.appVersionSource === 'remote' && eas.build.testflight.autoIncrement === true, 'Avoid duplicate TestFlight build numbers.');
  assert(configSource.includes('APPLETICS_IOS_BUNDLE_IDENTIFIER') && configSource.includes('throw new Error'), 'Do not fabricate an Apple bundle ID.');
  assert(configSource.includes("name !== '@stripe/stripe-react-native'"), 'The beta must not require an unconfigured Apple Pay entitlement.');
  assert(app.name === 'Appletics' && app.extra.distribution === 'testflight', 'Consistent beta name and build metadata.');
  assert(app.scheme.includes('appletics') && app.scheme.includes('onspaceapp'), 'Preserve existing and hosted callback schemes.');
});

Deno.test('iOS beta cannot invoke a Stripe write or launch an external purchase', async () => {
  const [policy, billing, browser, sheet, upgrade] = await Promise.all([
    read('services/releasePolicyService.ts'), read('services/billingService.ts'), read('services/billingBrowserService.ts'), read('services/billingPaymentSheetService.ts'), read('app/upgrade.tsx'),
  ]);
  assert(policy.includes("externalBillingAllowed: Platform.OS !== 'ios'"), 'iOS purchases fail closed.');
  assert(billing.indexOf("action !== 'config' && action !== 'check'") < billing.indexOf('client.functions.invoke'), 'Block writes before reaching the backend.');
  assert(browser.indexOf('assertExternalBillingAllowed();') < browser.indexOf('await WebBrowser.openAuthSessionAsync'), 'Do not bypass the guard through a browser.');
  assert(sheet.includes('assertExternalBillingAllowed();'), 'Do not initialize the native SDK on iOS.');
  assert(upgrade.includes('if (!release.externalBillingAllowed) return <BetaBillingScreen'), 'No paywall checkout UI in the iOS beta.');
});

Deno.test('account erasure requires an authenticated current password and never trusts a supplied user ID', async () => {
  const server = await read('supabase/functions/appletics-delete-account/index.ts');
  const verifiedAt = server.indexOf('verifier.auth.signInWithPassword');
  const stripeEraseAt = server.indexOf('await stripe.customers.del');
  const dataEraseAt = server.indexOf("admin.rpc('appletics_erase_account_data'");
  assert(server.indexOf("req.method === 'OPTIONS'") < server.indexOf('admin.auth.getUser(token)'), 'Handle preflight before authentication.');
  assert(server.includes("body.confirmation !== 'DELETE_APPLETICS'") && server.includes('verified.user?.id !== user.id'), 'Explicit consent and matching password owner.');
  assert(verifiedAt > 0 && verifiedAt < stripeEraseAt && stripeEraseAt < dataEraseAt, 'Reauthenticate before test billing and private-data erasure.');
  assert(!server.includes('body.userId') && !server.includes('body.user_id'), 'Deletion identity comes only from the JWT.');
  assert(server.includes("/^(sk|rk)_test_/") && server.includes('customer.livemode'), 'No live customer may be deleted by this beta.');
  assert(server.includes('admin.auth.admin.deleteUser(user.id, true)'), 'Use irreversible auth erasure, not a recoverable ban.');
  assert(!server.includes('console.log') && !server.includes('console.error(reason') && !server.includes('JSON.stringify(body)'), 'Never log passwords, JWTs or complete failures.');
});

Deno.test('deleted accounts cannot restore identity or use an unexpired JWT to recreate data', async () => {
  const sql = await read('supabase/migrations/202610250001_beta_account_erasure.sql');
  assert(sql.includes('account_deleted_at is null') && sql.includes('as restrictive'), 'All permissive policies are constrained by active-account status.');
  assert(sql.includes("array['select','insert','update','delete']"), 'Use separate active-account policies for each operation.');
  assert(sql.includes('from public,anon,authenticated') && sql.includes('to service_role'), 'Only the server may invoke account erasure.');
  assert(sql.includes("auth.role() is distinct from 'service_role'"), 'Defense in depth for the cleanup function.');
  assert(sql.includes("username=null,email='deleted+'") && sql.includes('appletics_profile=null'), 'Remove personal profile fields.');
  assert(sql.includes('where id=new.id and account_deleted_at is null'), 'Old auth metadata must not restore a tombstone username.');
  assert(sql.includes('exists(select 1 from public.shared_groups where id=old.group_id)'), 'Parent cascade deletion must not recreate invalid audit references.');
});

Deno.test('local erasure waits for server confirmation and queued writes cannot resurrect data', async () => {
  const [context, workspace, clubs, ui] = await Promise.all([read('contexts/AppContext.tsx'), read('services/localWorkspaceService.ts'), read('services/clubCoachService.ts'), read('components/auth/AccountDeletionModal.tsx')]);
  const deletion = context.slice(context.indexOf('const deleteAccount = useCallback'));
  assert(deletion.indexOf('await eraseCloudAccount(password)') < deletion.indexOf('clearLocalWorkspace(owner)'), 'Do not erase history after a failed cloud request.');
  assert(workspace.includes('deletedOwners.add(userId)') && workspace.includes('deletedOwners.has(userId)'), 'Serialize and block late workspace writes.');
  assert(clubs.includes('deletedAccounts.add(userId)') && clubs.includes('isDeletedScope(clubId)'), 'Serialize and block late roster writes.');
  assert(ui.includes('Mot de passe actuel') && ui.includes('accessibilityRole="checkbox"') && ui.includes('deletion.busy'), 'Confirmation remains keyboard-accessible and duplicate operations are disabled.');
});

Deno.test('beta limitations and genuine testing information are available without inventing public links', async () => {
  const [notice, info, docs, localized] = await Promise.all([read('components/feature/BetaFeatureNotice.tsx'), read('app/beta-info.tsx'), read('docs/testflight-release.md'), read('services/localizationService.ts')]);
  assert(notice.includes('discussions sont locales') && notice.includes('aucun accès Cloud'), 'Do not imply working multi-device chat or club permissions.');
  assert(info.includes('fictifs') && info.includes('réinstallation') && info.includes('référence technique anonymisée'), 'Disclose test data, local-history and retention limits.');
  assert(docs.includes('n’ont pas été exécutées') && docs.includes('revue bêta Apple'), 'Do not claim a signed, tested or approved build.');
  assert(localized.includes('...betaTranslations'), 'Beta instructions use the shared French, German and Italian catalog.');
});
