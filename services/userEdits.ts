// Tells apart what a person just entered from what the background sync wrote, so that only real
// entries trigger a notification (and only from the device where they were entered).
let syncDepth = 0;
const pending = new Set<string>();

// Runs state updates made by the background sync (never counted as a person's entry).
export function asSync<T>(write: () => T): T {
  syncDepth++;
  try { return write(); } finally { syncDepth--; }
}

export function markUserEdit(key: string) { if (syncDepth === 0) pending.add(key); }

// True once if this entry was made by the person on this device.
export function consumeUserEdit(key: string) { const had = pending.has(key); pending.delete(key); return had; }

export const resultEditKey = (competitionId: string, athleteId: string) => `comp|${competitionId}|${athleteId}`;
export const sessionEditKey = (sessionId: string, athleteId: string) => `session|${sessionId}|${athleteId}`;
