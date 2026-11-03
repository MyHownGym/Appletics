// Source contracts for account-separated local sports data. Not a native device test.
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path,root));
function assert(value: boolean,message: string) { if (!value) throw new Error(message); }
Deno.test('local workspaces are scoped to authenticated identity without deleting legacy history', async () => {
 const [service,context] = await Promise.all([read('services/localWorkspaceService.ts'),read('contexts/AppContext.tsx')]);
 assert(service.includes('workspace_v2:${userId}'), 'Store each account in its own key');
 assert(service.includes('owner && owner !== userId'), 'Never offer another account legacy history');
 assert(context.includes('stored.owner === authId && authId'), 'Hide former-account data synchronously');
 assert(context.includes('Conserver mon historique') && context.includes('Commencer sans importer'), 'Ask before associating history');
 assert(!context.includes('MOCK_ATHLETES') && !context.includes('MOCK_MESSAGES'), 'New accounts cannot be silently populated with demo content');
 assert(!service.includes('removeItem(ATHLETE_DATA_KEY)'), 'Legacy history stays intact');
});
Deno.test('onboarding uses verified credentials and given name, while passwords stay out of profile storage', async () => {
 const [coach,club,account,profile,unlock] = await Promise.all([read('app/onboarding.tsx'),read('app/club-onboarding.tsx'),read('hooks/useOnboardingAccount.ts'),read('services/accountProfileService.ts'),read('hooks/useAccountUnlock.ts')]);
 assert(coach.includes('!firstName.trim()') && club.includes('!firstName.trim()'), 'Given name required in all onboarding roles');
 assert(coach.includes('OnboardingAccount') && club.includes('OnboardingAccount'), 'All roles reuse the account flow');
 assert(account.includes('await saveAccountProfile(next)') && account.includes('next.id = auth.user.id'), 'Persist a profile only for the verified account');
 assert(!profile.includes('password:') && !profile.includes('AsyncStorage'), 'Never persist credentials in profiles');
 assert(unlock.includes('auth.signInWithPassword') && unlock.includes('result.user.id !== user.id'), 'Password fallback must verify the locked account');
});
