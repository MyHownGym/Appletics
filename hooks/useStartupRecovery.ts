import { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useStartup } from '@/hooks/useStartup';
import { useI18n } from '@/hooks/useI18n';
import { useReleasePolicy } from '@/hooks/useReleasePolicy';
import { startupCopy } from '@/constants/startup';
import { openStartupSupport, startupDiagnostic } from '@/services/startupService';
export function useStartupRecovery() {
  const startup = useStartup();
  const { language } = useI18n();
  const release = useReleasePolicy();
  const copy = startupCopy[language as keyof typeof startupCopy] ?? startupCopy.fr;
  const [supportFailed, setSupportFailed] = useState(false);
  const [supportBusy, setSupportBusy] = useState(false);
  useEffect(() => { setSupportFailed(false); }, [startup.attempt]);
  const onLayout = useCallback(() => {
    // The visible React shell has committed; do not wait for auth, billing or a cloud profile to hide the native splash.
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  const diagnostic = startupDiagnostic(release.version, release.build, startup.phase);
  const contactSupport = useCallback(async () => {
    if (supportBusy) return;
    setSupportBusy(true);
    setSupportFailed(!(await openStartupSupport(diagnostic)));
    setSupportBusy(false);
  }, [diagnostic, supportBusy]);
  return { ...startup, copy, diagnostic, onLayout, contactSupport, supportFailed, supportBusy,
    blocked: startup.timedOut || !!startup.error,
  };
}
