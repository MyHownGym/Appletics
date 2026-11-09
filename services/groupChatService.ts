import { getSupabaseClient } from '@/template';

// Online group chat: one conversation per shared group (see supabase/migrations/202611050001_group_chat.sql).
export interface GroupMessage { id: string; group_id: string; sender_id: string; sender_name: string; body: string; created_at: string; attachment_path?: string | null; attachment_name?: string | null; attachment_type?: string | null; attachment_url?: string | null }
export interface GroupReaction { message_id: string; user_id: string; emoji: string }
const BUCKET = 'chat-files';

const PAGE = 100;
const fail = (message: string): never => { throw new Error(message); };

export async function loadGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await getSupabaseClient()
    .from('group_messages').select('*')
    .eq('group_id', groupId).order('created_at', { ascending: false }).limit(PAGE);
  if (error) fail('Impossible de charger les messages. Vérifiez votre connexion.');
  return withAttachmentUrls(((data ?? []) as GroupMessage[]).reverse());
}

// Private files: temporary links (1 h) for the images and files of these messages.
export async function withAttachmentUrls(messages: GroupMessage[]): Promise<GroupMessage[]> {
  const paths = messages.map(item => item.attachment_path).filter((path): path is string => !!path && !messages.find(m => m.attachment_path === path)?.attachment_url);
  if (!paths.length) return messages;
  const { data } = await getSupabaseClient().storage.from(BUCKET).createSignedUrls(paths, 3600);
  const urls = new Map((data ?? []).filter(item => item.signedUrl).map(item => [item.path, item.signedUrl]));
  return messages.map(item => (item.attachment_path && urls.get(item.attachment_path) ? { ...item, attachment_url: urls.get(item.attachment_path) } : item));
}

// Sends an image or a file (20 MB max), with an optional caption.
export async function sendGroupAttachment(groupId: string, file: { uri: string; name: string; type: string; size?: number; file?: Blob }, caption: string, senderName: string): Promise<GroupMessage> {
  if (file.size && file.size > 20 * 1024 * 1024) fail('Fichier trop lourd (20 Mo maximum).');
  const client = getSupabaseClient();
  const safe = file.name.normalize('NFD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80) || 'fichier';
  const path = `${groupId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const body = file.file ?? await (await fetch(file.uri)).blob();
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, body, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (uploadError) fail(/bucket|not found/i.test(uploadError.message) ? 'Envoi de fichiers pas encore activé (fichier SQL n°14 à appliquer dans Supabase).' : 'Fichier non envoyé. Réessayez.');
  const { data, error } = await client.from('group_messages')
    .insert({ group_id: groupId, body: caption.trim().slice(0, 2000), sender_name: senderName.slice(0, 120), attachment_path: path, attachment_name: file.name.slice(0, 200), attachment_type: (file.type || '').slice(0, 100) })
    .select('*').single();
  if (error || !data) fail('Fichier non envoyé. Réessayez.');
  return (await withAttachmentUrls([data as GroupMessage]))[0];
}

export async function loadReactions(messageIds: string[]): Promise<GroupReaction[]> {
  if (!messageIds.length) return [];
  const { data, error } = await getSupabaseClient().from('group_message_reactions').select('message_id,user_id,emoji').in('message_id', messageIds);
  return error ? [] : (data ?? []) as GroupReaction[];
}

// One reaction per person and message; the same emoji again removes it.
export async function setReaction(messageId: string, emoji: string | null): Promise<void> {
  const client = getSupabaseClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id; if (!userId) return;
  const { error } = emoji
    ? await client.from('group_message_reactions').upsert({ message_id: messageId, user_id: userId, emoji })
    : await client.from('group_message_reactions').delete().eq('message_id', messageId).eq('user_id', userId);
  if (error) fail(error.code === '42P01' || error.code === 'PGRST205' ? 'Réactions pas encore activées (fichier SQL n°14).' : 'Réaction non enregistrée.');
}

export async function sendGroupMessage(groupId: string, body: string, senderName: string): Promise<GroupMessage> {
  const text = body.trim();
  if (!text) fail('Écrivez un message.');
  if (text.length > 2000) fail('Message trop long (2000 caractères maximum).');
  const { data, error } = await getSupabaseClient()
    .from('group_messages').insert({ group_id: groupId, body: text, sender_name: senderName.slice(0, 120) })
    .select('*').single();
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
