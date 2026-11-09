// Unread group messages: counts per group, "read up to" dates kept on the device, app icon badge.
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';

type Counts = Record<string, number>;
let counts: Counts = {};
let owner = '';
let readUpTo: Record<string, string> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
const key = (userId: string) => `@appletics_read:${userId}`;

export const unreadTotal = (value: Counts = counts) => Object.values(value).reduce((sum, count) => sum + count, 0);

// App icon badge (installed app on the iPhone home screen / desktop) — kept in step with the service worker.
function updateBadge(total: number) {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try { void (total > 0 ? nav.setAppBadge?.(total) : nav.clearAppBadge?.())?.catch(() => {}); } catch { /* not supported */ }
  try { navigator.serviceWorker?.controller?.postMessage({ type: 'appletics-badge', count: total }); } catch { /* no worker */ }
}

function setCounts(next: Counts) {
  counts = next;
  updateBadge(unreadTotal());
  emit();
}

async function loadReadState(userId: string) {
  if (owner === userId) return;
  owner = userId;
  try { readUpTo = JSON.parse((await AsyncStorage.getItem(key(userId))) || '{}'); } catch { readUpTo = {}; }
}

// Recounts unread messages of these groups (messages of others, after the "read up to" date).
export async function refreshUnread(userId: string, groupIds: string[]) {
  if (!userId || !groupIds.length) { setCounts({}); return; }
  await loadReadState(userId);
  const now = new Date().toISOString();
  let changed = false;
  for (const id of groupIds) if (!readUpTo[id]) { readUpTo[id] = now; changed = true; } // new group: start from now
  if (changed) void AsyncStorage.setItem(key(userId), JSON.stringify(readUpTo)).catch(() => {});
  const since = groupIds.map(id => readUpTo[id]).sort()[0];
  const { data, error } = await getSupabaseClient().from('group_messages').select('id, group_id, sender_id, created_at')
    .in('group_id', groupIds).neq('sender_id', userId).gt('created_at', since).order('created_at', { ascending: false }).limit(500);
  if (error) return;
  const next: Counts = {};
  for (const row of data ?? []) if (row.created_at > (readUpTo[row.group_id] ?? now)) next[row.group_id] = (next[row.group_id] ?? 0) + 1;
  setCounts(next);
}

// The conversation is open: everything up to its latest message is read.
export async function markGroupRead(userId: string, groupId: string, latest: string | undefined) {
  if (!userId || !groupId) return;
  await loadReadState(userId);
  const at = latest && latest > (readUpTo[groupId] ?? '') ? latest : readUpTo[groupId] ?? new Date().toISOString();
  readUpTo = { ...readUpTo, [groupId]: at };
  void AsyncStorage.setItem(key(userId), JSON.stringify(readUpTo)).catch(() => {});
  if (counts[groupId]) { const next = { ...counts }; delete next[groupId]; setCounts(next); }
}

export function useUnreadCounts(): Counts {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => counts, () => counts);
}
