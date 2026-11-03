import { useEffect } from 'react';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useStartup } from '@/hooks/useStartup';
export function useStartupProgress() {
  const auth = useAuth();
  const { onboardingLoading, accountProfileLoading, startupError, startupAwaitingConsent } = useApp();
  const { report } = useStartup();
  useEffect(() => {
    const phase = auth.loading ? 'authentication' : onboardingLoading || (!auth.user && startupError) ? 'device' : startupAwaitingConsent ? 'consent' : accountProfileLoading || startupError ? 'profile' : 'ready';
    report(phase, startupError);
  }, [auth.loading, auth.user?.id, onboardingLoading, accountProfileLoading, startupError, startupAwaitingConsent, report]);
}
