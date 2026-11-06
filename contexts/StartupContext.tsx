import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STARTUP_WAIT_MS, type StartupPhase } from '@/constants/startup';
interface StartupContextValue {
  phase: StartupPhase;
  error: string;
  timedOut: boolean;
  attempt: number;
  report: (phase: StartupPhase, error?: string) => void;
  retry: () => void;
}
export const StartupContext = createContext<StartupContextValue | undefined>(undefined);
export function StartupProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<{ phase: StartupPhase; error: string }>({ phase: 'provider', error: '' });
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setTimedOut(false);
    if (status.phase === 'ready' || status.phase === 'consent' || status.error) return;
    const timer = setTimeout(() => setTimedOut(true), STARTUP_WAIT_MS);
    return () => clearTimeout(timer);
  }, [status.phase, status.error, attempt]);
  const report = useCallback((phase: StartupPhase, error = '') => {
    setStatus(previous => previous.phase === phase && previous.error === error ? previous : { phase, error });
  }, []);
  const retry = useCallback(() => {
    // Reinitialize existing providers, not the client or stored session. Never sign out or erase storage.
    setStatus({ phase: 'provider', error: '' });
    setTimedOut(false);
    setAttempt(value => value + 1);
  }, []);
  const value = useMemo(() => ({ ...status, timedOut, attempt, report, retry }), [status, timedOut, attempt, report, retry]);
  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}
