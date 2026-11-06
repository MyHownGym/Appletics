// Source-contract checks, not native crash reproduction or device validation.
// Run: deno test --allow-read supabase/functions/_shared/testflightStartupIntegration_test.ts
const projectRoot = new URL('../../../', import.meta.url);
const readSource = (path: string) => Deno.readTextFile(new URL(path, projectRoot));
function assertContract(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}

Deno.test('iOS architecture workaround is based on the installed Expo SDK and confined to supported versions', async () => {
  const source = await readSource('app.config.ts');
  assertContract(source.includes("require('expo/package.json')"), 'Resolve the actual installed build-time SDK; do not infer it from a crash.');
  assertContract(source.includes('expoMajor >= 52 && expoMajor <= 54'), 'Do not pretend legacy architecture can be selected in Expo 55+.');
  const iosSource = source.slice(source.indexOf('    ios: {'));
  assertContract(iosSource.includes('...(legacyIosSupported ? { newArchEnabled: false } : {})'), 'Override architecture only on iOS and only when supported.');
  assertContract(iosSource.includes('...config.ios') && iosSource.includes('bundleIdentifier'), 'Keep owner-supplied iOS settings and identity.');
  assertContract(!source.includes("jsEngine: 'jsc'") && !source.includes('android: {'), 'Do not switch JS engines or change Android configuration.');
});

Deno.test('startup workaround preserves root providers and does not erase local history', async () => {
  const [config, layout, docs] = await Promise.all([
    readSource('app.config.ts'), readSource('app/_layout.tsx'), readSource('docs/testflight-startup-crash.md'),
  ]);
  assertContract(layout.includes('<AlertProvider>') && layout.includes('<AuthProvider>') && layout.includes('<AppProvider>'), 'Retain alerts, authentication and workspace state.');
  assertContract(!config.includes('AsyncStorage') && !config.includes('clearLocalWorkspace'), 'A native architecture workaround must not change user data.');
  assertContract(docs.includes('sans supprimer Appletics') && docs.includes('aucun test iPhone'), 'Explicitly preserve local data and disclose unverified native behavior.');
  assertContract(docs.includes('Expo 55+') && docs.includes('dSYM'), 'Document the supported-SDK boundary and the remaining symbolication path.');
});
