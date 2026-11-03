import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAthleteData, clearAthleteData, type AthleteData } from '@/services/athleteStorageService';
import type { ChatChannel, ChatMessage, SessionPerformance, TrainingPlan } from '@/types';
export interface LocalWorkspace extends AthleteData { trainingPlans: TrainingPlan[]; channels: ChatChannel[]; messages: Record<string,ChatMessage[]>; sessionPerformances: SessionPerformance[] }
export function emptyLocalWorkspace(): LocalWorkspace { return { athletes: [], results: [], competitions: [], trainingPlans: [], channels: [], messages: {}, sessionPerformances: [] }; }
const key = (userId: string) => `@appletics_workspace_v2:${userId}`;
const legacyOwnerKey = '@appletics_legacy_workspace_owner';
let pending = Promise.resolve();
const deletedOwners = new Set<string>();
export async function loadLocalWorkspace(userId: string) {
 const stored = await AsyncStorage.getItem(key(userId));
 if (stored) {
  const data = JSON.parse(stored);
  if (!data || typeof data !== 'object') throw new Error('Données locales illisibles.');
  if (!['athletes','results','competitions','trainingPlans','channels','sessionPerformances'].every(field => Array.isArray(data[field])) || !data.messages || typeof data.messages !== 'object') throw new Error('Données locales illisibles.');
  return { data: data as LocalWorkspace, legacy: null };
 }
 const owner = await AsyncStorage.getItem(legacyOwnerKey);
 if (owner && owner !== userId) return { data: emptyLocalWorkspace(), legacy: null };
 const legacy = await loadAthleteData();
 const performances = await AsyncStorage.getItem('@appletics_performances');
 if (!legacy && !performances) return { data: emptyLocalWorkspace(), legacy: null };
 const sessionPerformances = performances ? JSON.parse(performances) : [];
 if (!Array.isArray(sessionPerformances)) throw new Error('Données locales illisibles.');
 return { data: emptyLocalWorkspace(), legacy: { ...(legacy ?? { athletes: [],results: [],competitions: [] }), sessionPerformances: sessionPerformances as SessionPerformance[] } };
}
export async function claimLegacyWorkspace(userId: string) { await AsyncStorage.setItem(legacyOwnerKey,userId); }
export function saveLocalWorkspace(userId: string,data: LocalWorkspace): Promise<void> {
 if (deletedOwners.has(userId)) return Promise.resolve();
 const serialized = JSON.stringify(data);
 pending = pending.catch(() => {}).then(() => deletedOwners.has(userId) ? undefined : AsyncStorage.setItem(key(userId),serialized));
 return pending;
}
export async function clearLocalWorkspace(userId: string) {
 deletedOwners.add(userId);
 await pending.catch(() => {});
 await AsyncStorage.removeItem(key(userId));
 // Only erase a legacy history whose ownership was explicitly claimed by this account.
 if (await AsyncStorage.getItem(legacyOwnerKey) === userId) {
  await clearAthleteData();
  await AsyncStorage.multiRemove(['@appletics_performances', '@appletics_user']);
  // Retain the ownership marker so another account cannot re-adopt a deleted history.
 }
}
