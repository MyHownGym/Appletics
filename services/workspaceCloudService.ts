// Online backup of everything an account creates (plans, competitions, results, athletes, entries…).
// The device keeps working offline; the backup makes the data follow the account on any phone,
// computer, browser or the installed app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import type { LocalWorkspace } from '@/services/localWorkspaceService';

const syncedKey = (userId: string) => `@appletics_ws_synced:${userId}`; // server time of the last backup seen here
const dirtyKey = (userId: string) => `@appletics_ws_dirty:${userId}`;   // local changes not yet backed up
const baseKey = (userId: string) => `@appletics_ws_base:${userId}`;     // copy of the backup as last seen here (3-way merge)
const MAX_BYTES = 6 * 1024 * 1024;

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number) => Promise.race([Promise.resolve(promise), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

function isWorkspace(value: unknown): value is LocalWorkspace {
  const data = value as LocalWorkspace;
  return !!data && typeof data === 'object' && ['athletes', 'results', 'competitions', 'trainingPlans', 'channels', 'sessionPerformances'].every(field => Array.isArray((data as unknown as Record<string, unknown>)[field]));
}

export async function fetchCloudWorkspace(userId: string): Promise<{ data: LocalWorkspace; updatedAt: string } | null> {
  const { data, error } = await withTimeout(getSupabaseClient().from('user_workspaces').select('data, updated_at').eq('user_id', userId).maybeSingle(), 6000);
  if (error || !data || !isWorkspace(data.data)) return null;
  return { data: { ...data.data, messages: data.data.messages && typeof data.data.messages === 'object' ? data.data.messages : {} }, updatedAt: String(data.updated_at) };
}

export async function saveCloudWorkspace(userId: string, workspace: LocalWorkspace): Promise<boolean> {
  const serialized = JSON.stringify(workspace);
  if (serialized.length > MAX_BYTES) return false;
  const { data, error } = await withTimeout(getSupabaseClient().rpc('appletics_save_workspace', { p_data: workspace }), 15000);
  if (error || !data) return false;
  await AsyncStorage.multiSet([[syncedKey(userId), String(data)], [dirtyKey(userId), '0'], [baseKey(userId), serialized]]);
  return true;
}

export const markWorkspaceDirty = (userId: string) => AsyncStorage.setItem(dirtyKey(userId), '1').catch(() => {});

// Union of two workspaces: nothing created on either side is lost. Same id: `primary` wins.
export function mergeWorkspaces(primary: LocalWorkspace, secondary: LocalWorkspace): LocalWorkspace {
  const union = <T extends { id: string }>(a: T[] = [], b: T[] = []) => [...a, ...b.filter(item => !a.some(other => other.id === item.id))];
  const messages: LocalWorkspace['messages'] = { ...(secondary.messages ?? {}) };
  for (const [channel, list] of Object.entries(primary.messages ?? {})) messages[channel] = union(list, secondary.messages?.[channel]);
  return {
    ...secondary, ...primary,
    athletes: union(primary.athletes, secondary.athletes),
    results: union(primary.results, secondary.results),
    competitions: union(primary.competitions, secondary.competitions),
    trainingPlans: union(primary.trainingPlans, secondary.trainingPlans),
    channels: union(primary.channels, secondary.channels),
    sessionPerformances: union(primary.sessionPerformances, secondary.sessionPerformances),
    messages,
  };
}

// Three-way merge against the last backup seen on this device: what changed here wins, what changed on
// another device is taken (edits and deletions), what changed on both keeps this device's version.
type Keyed = { id: string };
function merge3<T extends Keyed>(local: T[] = [], remote: T[] = [], base: T[] = []): T[] {
  const enc = (item?: T) => (item ? JSON.stringify(item) : undefined);
  const byId = (list: T[]) => new Map(list.map(item => [item.id, item]));
  const L = byId(local), R = byId(remote), B = byId(base);
  const ids = [...L.keys(), ...[...R.keys()].filter(id => !L.has(id))];
  const out: T[] = [];
  for (const id of ids) {
    const l = L.get(id), r = R.get(id), b = B.get(id);
    let pick: T | undefined;
    if (enc(l) === enc(r)) pick = l;
    else if (!b) pick = l ?? r;                 // created on one side (or both): kept
    else if (enc(l) === enc(b)) pick = r;       // changed or deleted elsewhere only
    else if (enc(r) === enc(b)) pick = l;       // changed or deleted here only
    else pick = l ?? r;                         // changed on both: this device's version
    if (pick) out.push(pick);
  }
  return out;
}
function mergeMessages(local: LocalWorkspace['messages'] = {}, remote: LocalWorkspace['messages'] = {}, base: LocalWorkspace['messages'] = {}) {
  const out: LocalWorkspace['messages'] = {};
  for (const channel of new Set([...Object.keys(local), ...Object.keys(remote)])) out[channel] = merge3(local[channel], remote[channel], base[channel]);
  return out;
}
export function mergeWorkspaces3(local: LocalWorkspace, remote: LocalWorkspace, base: LocalWorkspace): LocalWorkspace {
  return {
    ...remote, ...local,
    athletes: merge3(local.athletes, remote.athletes, base.athletes),
    results: merge3(local.results, remote.results, base.results),
    competitions: merge3(local.competitions, remote.competitions, base.competitions),
    trainingPlans: merge3(local.trainingPlans, remote.trainingPlans, base.trainingPlans),
    channels: merge3(local.channels, remote.channels, base.channels),
    sessionPerformances: merge3(local.sessionPerformances, remote.sessionPerformances, base.sessionPerformances),
    messages: mergeMessages(local.messages, remote.messages, base.messages),
  };
}

const isEmpty = (workspace: LocalWorkspace) => !workspace.athletes.length && !workspace.results.length && !workspace.competitions.length && !workspace.trainingPlans.length && !workspace.sessionPerformances.length && !workspace.channels.length;

// Decides what this device shows at startup (or when the app comes back to the foreground):
// - first time on this device: local + online merged;
// - backup changed elsewhere and nothing changed here: the online version (deletions included);
// - both changed: merged, so nothing is lost.
export async function reconcileWithCloud(userId: string, local: LocalWorkspace): Promise<{ data: LocalWorkspace; changed: boolean; needsPush: boolean }> {
  let remote: Awaited<ReturnType<typeof fetchCloudWorkspace>> = null;
  try { remote = await fetchCloudWorkspace(userId); } catch { return { data: local, changed: false, needsPush: false }; }
  const [[, synced], [, dirty], [, baseRaw]] = await AsyncStorage.multiGet([syncedKey(userId), dirtyKey(userId), baseKey(userId)]);
  if (!remote) return { data: local, changed: false, needsPush: !isEmpty(local) };
  if (synced && synced === remote.updatedAt) return { data: local, changed: false, needsPush: dirty === '1' };
  let base: LocalWorkspace | null = null;
  try { base = baseRaw ? JSON.parse(baseRaw) : null; } catch { base = null; }
  await AsyncStorage.multiSet([[syncedKey(userId), remote.updatedAt], [baseKey(userId), JSON.stringify(remote.data)]]);
  // First time on this device: union, nothing lost. Afterwards: three-way merge (edits and deletions follow).
  const merged = base ? mergeWorkspaces3(local, remote.data, base) : mergeWorkspaces(local, remote.data);
  const same = JSON.stringify(merged) === JSON.stringify(remote.data);
  if (same) await AsyncStorage.setItem(dirtyKey(userId), '0');
  return { data: merged, changed: JSON.stringify(merged) !== JSON.stringify(local), needsPush: !same };
}
