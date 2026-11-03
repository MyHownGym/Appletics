import type { ConfigContext, ExpoConfig } from 'expo/config';

// Build-time metadata only; do not guess the native runtime from a crash report.
// Expo 52–54 can opt out of the iOS TurboModule/bridgeless path implicated in
// incident E183DD47-4169-4ACE-8CA9-7D46E1F51888. SDK 55+ cannot disable it.
const { version: expoVersion } = require('expo/package.json') as { version: string };
const expoMajor = Number.parseInt(expoVersion.split('.')[0], 10);
const legacyIosSupported = expoMajor >= 52 && expoMajor <= 54;

// Build identifiers are supplied by the owner. No fabricated bundle ID, Apple account or store URL.
export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const distribution = process.env.APPLETICS_DISTRIBUTION ?? config.extra?.distribution ?? 'development';
  const testflightBuild = process.env.EAS_BUILD_PROFILE === 'testflight' || process.env.APPLETICS_DISTRIBUTION === 'testflight';
  const bundleIdentifier = process.env.APPLETICS_IOS_BUNDLE_IDENTIFIER ?? config.ios?.bundleIdentifier;
  if (testflightBuild && (!bundleIdentifier || !/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)+$/.test(bundleIdentifier))) {
    throw new Error('TestFlight : renseignez APPLETICS_IOS_BUNDLE_IDENTIFIER avec l’identifiant iOS définitif enregistré dans Apple Developer / App Store Connect. Aucune valeur ne sera inventée.');
  }
  if (process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PLATFORM === 'ios') {
    console.warn(legacyIosSupported
      ? `[Appletics iOS] Expo ${expoVersion}: legacy architecture selected for the TestFlight startup-crash workaround. Device validation is still required.`
      : `[Appletics iOS] Expo ${expoVersion}: no legacy-architecture workaround applied. SDK 55+ requires a compatible native React Native fix and symbolication if the startup crash persists.`);
  }
  const plugins = (config.plugins ?? []).filter(plugin => {
    const name = typeof plugin === 'string' ? plugin : plugin[0];
    // iOS beta has no Stripe purchase UI. Do not require an unconfigured Apple Pay merchant entitlement to sign it.
    return distribution !== 'testflight' || name !== '@stripe/stripe-react-native';
  });
  return {
    ...config,
    name: 'Appletics',
    slug: config.slug ?? 'onspace-app',
    version: config.version ?? '1.0.0',
    extra: { ...config.extra, distribution },
    plugins,
    ios: {
      ...config.ios,
      // iOS-only, supported SDKs only. Keep Hermes and Android configuration unchanged.
      // This changes the native binary and requires a rebuild, not a JS/OTA update.
      ...(legacyIosSupported ? { newArchEnabled: false } : {}),
      ...(bundleIdentifier ? { bundleIdentifier } : {}),
      infoPlist: { ...config.ios?.infoPlist, CFBundleDisplayName: 'Appletics' },
    },
  };
}
