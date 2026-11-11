// Welcome tour: shown once per account, can be replayed from the settings.
import AsyncStorage from '@react-native-async-storage/async-storage';
const key = (userId: string) => `@appletics_tour_done:${userId}`;
const listeners = new Set<() => void>();
export const tourSeen = async (userId: string) => (await AsyncStorage.getItem(key(userId)).catch(() => null)) === '1';
export const markTourSeen = (userId: string) => AsyncStorage.setItem(key(userId), '1').catch(() => {});
// Only one tour may be open at a time, even if the layout is mounted several times.
let openOwner: symbol | null = null;
export const claimTour = (owner: symbol) => { if (openOwner && openOwner !== owner) return false; openOwner = owner; return true; };
export const releaseTour = (owner: symbol) => { if (openOwner === owner) openOwner = null; };
const seenThisSession = new Set<string>();
export const markSeenLocal = (userId: string) => { seenThisSession.add(userId); };
export const seenLocal = (userId: string) => seenThisSession.has(userId);
export function replayTour() { const last = [...listeners].pop(); last?.(); }
export function onReplayTour(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
