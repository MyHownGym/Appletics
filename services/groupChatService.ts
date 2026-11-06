import { getSupabaseClient } from '@/template';

// Online group chat: one conversation per shared group (see supabase/migrations/202611050001_group_chat.sql).
export interface GroupMessage { id: string; group_id: string; sender_id: string; sender_name: string; body: string; created_at: string }

const PAGE = 100;
const fail = (message: string): never => { throw new Error(message); };

export async function loadGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await getSupabaseClient()
    .from('group_messages').select('id,group_id,sender_id,sender_name,body,created_at')
    .eq('group_id', groupId).order('created_at', { ascending: false }).limit(PAGE);
  if (error) fail('Impossible de charger les messages. Vérifiez votre connexion.');
  return ((data ?? []) as GroupMessage[]).reverse();
}

export async function sendGroupMessage(groupId: string, body: string, senderName: string): Promise<GroupMessage> {
  const text = body.trim();
  if (!text) fail('Écrivez un message.');
  if (text.length > 2000) fail('Message trop long (2000 caractères maximum).');
  const { data, error } = await getSupabaseClient()
    .from('group_messages').insert({ group_id: groupId, body: text, sender_name: senderName.slice(0, 120) })
    .select('id,group_id,sender_id,sender_name,body,created_at').single();
  if (error || !data) fail('Message non envoyé. Vérifiez votre connexion et réessayez.');
  return data as GroupMessage;
}

export async function deleteGroupMessage(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('group_messages').delete().eq('id', id);
  if (error) fail('Suppression impossible.');
}

export async function markGroupRead(groupId: string): Promise<void> {
  await getSupabaseClient().from('group_message_reads').upsert({ group_id: groupId, last_read_at: new Date().toISOString() });
}

export async function reportGroupMessage(messageId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseClient().from('message_reports').insert({ message_id: messageId, reason: reason.slice(0, 500) });
  if (error && error.code !== '23505') fail('Signalement impossible. Réessayez.');
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('user_blocks').insert({ blocked_id: userId });
  if (error && error.code !== '23505') fail('Blocage impossible. Réessayez.');
}

export async function loadBlockedUsers(): Promise<string[]> {
  const { data, error } = await getSupabaseClient().from('user_blocks').select('blocked_id');
  if (error) return [];
  return (data ?? []).map((row: { blocked_id: string }) => row.blocked_id);
}

// Realtime: calls onInsert for each new message of the group, onDelete for removed ones. Returns an unsubscribe function.
export function subscribeGroupMessages(groupId: string, onInsert: (message: GroupMessage) => void, onDelete: (id: string) => void): () => void {
  const client = getSupabaseClient();
  const channel = client
    .channel(`group-messages-${groupId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
      payload => onInsert(payload.new as GroupMessage))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' },
      payload => { const id = (payload.old as { id?: string })?.id; if (id) onDelete(id); })
    .subscribe();
  return () => { void client.removeChannel(channel); };
}
