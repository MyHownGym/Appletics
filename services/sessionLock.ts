// Once per app start, an account without biometrics opens directly: its lock screen protected nothing.
// After an explicit « Verrouiller maintenant », the lock screen stays until the person continues.
let startupUnlockDone = false;
export function consumeStartupUnlock(): boolean { if (startupUnlockDone) return false; startupUnlockDone = true; return true; }
export function markManualLock(): void { startupUnlockDone = true; }
