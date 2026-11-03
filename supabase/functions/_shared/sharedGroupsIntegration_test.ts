// Static regression contracts. Run from the exported repository with deno test --allow-read.
function assert(value: boolean, message: string) { if (!value) throw new Error(message); }
const root = new URL('../../../', import.meta.url);
const read = (file: string) => Deno.readTextFile(new URL(file,root));
Deno.test('Shared mutations are server-authorized RPCs, never local optimistic success', async () => {
 const service = await read('services/sharedGroupsService.ts');
 const provider = await read('contexts/SharedGroupsContext.tsx');
 assert(service.includes("getSupabaseClient().rpc(name, parameters)"), 'Use unique authenticated client');
 assert(service.includes('p_version: version'), 'Version required for concurrent editing');
 assert(!provider.includes('AsyncStorage'), 'Do not persist private group data across accounts');
 assert(provider.includes("identity.current !== userId"), 'Discard results from former accounts');
 assert(provider.includes('15000') && provider.includes('clearInterval'), 'Polling with cleanup');
 assert(provider.indexOf('await saveSharedPerformance') < provider.indexOf('performances: [result'), 'Only commit after server confirmation');
});
Deno.test('Athlete logging never selects an unrelated first athlete', async () => {
 const session = await read('app/session-edit.tsx');
 assert(!session.includes('|| athletes[0]'), 'No arbitrary athlete identity');
 assert(session.includes('useActivityScope()'), 'Explicit linked athlete');
 assert(session.includes('SessionSharingPanel'), 'Real shared publication UI');
});
Deno.test('Authentication and camera configuration remain complete', async () => {
 const layout = await read('app/_layout.tsx');
 const profile = await read('services/accountProfileService.ts');
 const config = JSON.parse(await read('app.json'));
 const photo = await read('services/profilePhotoService.ts');
 assert(layout.indexOf('<AlertProvider>') < layout.indexOf('<AuthProvider>'), 'Alerts outermost');
 assert(layout.includes('<SharedGroupsProvider>') && layout.includes('!auth.user'), 'Shared provider and auth guard');
 assert(profile.includes('pin: _pin') && profile.includes('biometricEnabled: _biometric'), 'No device secrets in profile');
 assert(photo.includes('launchCameraAsync') && photo.includes('getDocumentAsync') && photo.includes('launchImageLibraryAsync'), 'All three photo sources');
 assert(config.expo.plugins.find((plugin: unknown[]) => Array.isArray(plugin) && plugin[0] === 'expo-image-picker')[1].cameraPermission !== false, 'Native camera permission');
});
Deno.test('Checkout review shrinks the entire sheet when keyboard opens', async () => {
 const review = await read('components/feature/BillingCheckoutReview.tsx');
 assert(review.indexOf('<KeyboardAvoidingView') < review.indexOf('<SafeAreaView'), 'Keyboard container wraps entire sheet');
 assert(review.includes('keyboardDismissMode="interactive"'), 'Keyboard can be dismissed');
});
