// Training groups ("Sprint", "Demi-fond"…): cloud groups shared by several coaches and their athletes.
import { EVENT_GROUPS } from '@/constants/config';
import type { SharedData, SharedGroup } from '@/types/sharedGroups';

type Operate = <T = unknown>(name: string, parameters: Record<string, unknown>) => Promise<T>;

export const DISCIPLINES = EVENT_GROUPS;
export const disciplineOf = (group?: Pick<SharedGroup, 'discipline'> | null) => group?.discipline || 'all';
export const disciplineLabel = (id: string) => EVENT_GROUPS.find(item => item.id === id)?.label ?? 'Tous';
export const disciplineColor = (id: string) => EVENT_GROUPS.find(item => item.id === id)?.color ?? EVENT_GROUPS[0].color;
// Local athlete records need a concrete discipline: "Tous" falls back to sprint.
export const localGroupFor = (discipline: string) => (discipline && discipline !== 'all' ? discipline : 'sprints');

// Groups in which this user is a coach, oldest first (own groups before groups shared with them).
export function coachGroups(data: SharedData, userId: string | null) {
  if (!userId) return [];
  const mine = new Set(data.members.filter(item => item.user_id === userId && item.role === 'coach').map(item => item.group_id));
  return data.groups.filter(group => mine.has(group.id) || group.owner_id === userId)
    .sort((a, b) => Number(b.owner_id === userId) - Number(a.owner_id === userId) || a.created_at.localeCompare(b.created_at));
}

const missing = (error: unknown) => error instanceof Error && error.message === 'function_missing';

export async function createTrainingGroup(operate: Operate, name: string, discipline: string) {
  try { return await operate<string>('shared_create_training_group', { p_name: name.trim(), p_discipline: discipline }); }
  catch (error) { if (!missing(error)) throw error; return operate<string>('shared_create_group', { p_name: name.trim() }); }
}

export async function updateTrainingGroup(operate: Operate, groupId: string, name: string, discipline: string) {
  try { await operate('shared_update_group', { p_group: groupId, p_name: name.trim(), p_discipline: discipline }); }
  catch (error) { if (missing(error)) throw new Error('Mettez à jour la base Supabase (fichier SQL « groupes ») pour modifier un groupe.'); throw error; }
}

// Invites an athlete by e-mail into the chosen group (older servers: the coach's first group).
export async function inviteAthleteToGroup(operate: Operate, email: string, name: string, source: string, groupId?: string) {
  try { return await operate<string>('shared_invite_athlete_quick', { p_email: email, p_name: name, p_source: source, ...(groupId ? { p_group: groupId } : {}) }); }
  catch (first) {
    if (!missing(first)) throw first;
    try { return await operate<string>('shared_invite_athlete_quick', { p_email: email, p_name: name, p_source: source }); }
    catch (second) { if (!missing(second)) throw second; return operate<string>('shared_invite_athlete_quick', { p_email: email, p_name: name }); }
  }
}
