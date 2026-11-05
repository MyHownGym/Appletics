import { Linking } from 'react-native';
import { STARTUP_READ_TIMEOUT_MS, STARTUP_SESSION_DISPATCH_REVISION, type StartupPhase } from '@/constants/startup';

// Only use for reads: a timed-out promise is observed but its result is discarded.
// Do not wrap profile writes, payments, deletion or other mutations in this helper.
export async function withStartupDeadline<T>(task: PromiseLike<T>, message: string, timeoutMs = STARTUP_READ_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function startupDiagnostic(version: string, build: string, phase: StartupPhase): string {
  // No account identifiers, credentials or callback URLs in the support report.
  return `Appletics ${version} · build ${build} · startup:${phase} · auth-dispatch:${STARTUP_SESSION_DISPATCH_REVISION}`;
}
export async function openStartupSupport(diagnostic: string): Promise<boolean> {
  try {
    await Linking.openURL(`mailto:contact@onspace.ai?subject=${encodeURIComponent('Appletics — démarrage bloqué')}&body=${encodeURIComponent(diagnostic)}`);
    return true;
  } catch { return false; }
}
