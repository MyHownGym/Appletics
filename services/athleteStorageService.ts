import AsyncStorage from '@react-native-async-storage/async-storage';
import { Athlete, Competition, CompResult } from '@/types';

export const ATHLETE_DATA_KEY = '@appletics_athlete_data_v1';
export interface AthleteData {
  athletes: Athlete[];
  results: CompResult[];
  competitions: Competition[];
}
let pendingWrite: Promise<void> = Promise.resolve();

export async function loadAthleteData(): Promise<AthleteData | null> {
  const stored = await AsyncStorage.getItem(ATHLETE_DATA_KEY);
  if (!stored) return null;
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed.athletes) || !Array.isArray(parsed.results) || !Array.isArray(parsed.competitions)) return null;
  return parsed as AthleteData;
}

export function saveAthleteData(data: AthleteData): Promise<void> {
  const snapshot = JSON.stringify(data);
  pendingWrite = pendingWrite.catch(() => {}).then(() => AsyncStorage.setItem(ATHLETE_DATA_KEY, snapshot));
  return pendingWrite;
}

export async function clearAthleteData(): Promise<void> {
  await pendingWrite.catch(() => {});
  await AsyncStorage.removeItem(ATHLETE_DATA_KEY);
}
