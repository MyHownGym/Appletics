import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoachStatus = 'active' | 'pending' | 'suspended';
export type CoachRole = 'head_coach' | 'assistant_coach' | 'sprint_coach' | 'distance_coach' | 'field_coach' | 'admin';
export interface ClubCoach {
  id: string; name: string; email: string; role: CoachRole; status: CoachStatus;
  invitedAt: string; lastActive?: string; groupsManaged?: string[];
}
const storageKey = '@appletics_club_coaches_v1';
type ClubRosters = Record<string, ClubCoach[]>;
let writes: Promise<void> = Promise.resolve();
const deletedAccounts = new Set<string>();
function isDeletedScope(scope: string): boolean {
  for (const id of deletedAccounts) if (scope.startsWith(`${id}:`)) return true;
  return false;
}
async function loadRosters(): Promise<ClubRosters> {
  const saved = await AsyncStorage.getItem(storageKey);
  if (!saved) return {};
  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Annuaire local illisible.');
  return parsed;
}
export async function loadClubCoaches(clubId: string): Promise<ClubCoach[]> {
  await writes;
  if (isDeletedScope(clubId)) return [];
  const rosters = await loadRosters();
  const roster = rosters[clubId];
  return Array.isArray(roster) ? roster.filter(coach => coach?.id && coach?.email && ['active', 'pending', 'suspended'].includes(coach.status)) : [];
}
export function saveClubCoaches(clubId: string, coaches: ClubCoach[]): Promise<void> {
  if (isDeletedScope(clubId)) return Promise.resolve();
  const task = writes.catch(() => {}).then(async () => {
    // Re-check inside the queue: an earlier render must not resurrect a deleted account's roster.
    if (isDeletedScope(clubId)) return;
    const rosters = await loadRosters();
    if (isDeletedScope(clubId)) return;
    await AsyncStorage.setItem(storageKey, JSON.stringify({ ...rosters, [clubId]: coaches }));
  });
  writes = task.catch(() => {});
  return task;
}
export async function clearAccountClubCoaches(userId: string): Promise<void> {
  deletedAccounts.add(userId);
  const task = writes.catch(() => {}).then(async () => {
    const rosters = await loadRosters();
    const remaining = Object.fromEntries(Object.entries(rosters).filter(([scope]) => !scope.startsWith(`${userId}:`)));
    await AsyncStorage.setItem(storageKey, JSON.stringify(remaining));
  });
  writes = task.catch(() => {});
  await task;
}
export async function clearClubCoaches(): Promise<void> {
  await writes;
  await AsyncStorage.removeItem(storageKey);
}
