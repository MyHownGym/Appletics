// Welcome tour: shown once per account, can be replayed from the settings.
import AsyncStorage from '@react-native-async-storage/async-storage';
const key = (userId: string) => `@appletics_tour_done:${userId}`;
const listeners = new Set<() => void>();
export const tourSeen = async (userId: string) => (await AsyncStorage.getItem(key(userId)).catch(() => null)) === '1';
export const markTourSeen = (userId: string) => AsyncStorage.setItem(key(userId), '1').catch(() => {});
export function replayTour() { listeners.forEach(listener => listener()); }
export function onReplayTour(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
