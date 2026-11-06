import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import {
  blockUser, deleteGroupMessage, loadBlockedUsers, loadGroupMessages, markGroupRead,
  reportGroupMessage, sendGroupMessage, subscribeGroupMessages, type GroupMessage,
} from '@/services/groupChatService';

// State of one online group conversation: initial load, realtime updates, send, report and block.
export function useGroupChat(groupId: string) {
  const { user: authUser } = useAuth();
  const { user } = useApp();
  const userId = authUser?.id ?? '';
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const active = useRef(groupId);
  active.current = groupId;

  const upsert = useCallback((message: GroupMessage) => {
    setMessages(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message]
      .sort((a, b) => a.created_at.localeCompare(b.created_at)));
  }, []);

  const reload = useCallback(async () => {
    if (!groupId || !userId) return;
    setLoading(true);
    try {
      const [list, blocks] = await Promise.all([loadGroupMessages(groupId), loadBlockedUsers()]);
      if (active.current !== groupId) return;
      setMessages(list); setBlocked(blocks); setError('');
      void markGroupRead(groupId).catch(() => {});
    } catch (reason) {
      if (active.current === groupId) setError(reason instanceof Error ? reason.message : 'Impossible de charger les messages.');
    } finally {
      if (active.current === groupId) setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    setMessages([]); setError('');
    if (!groupId || !userId) { setLoading(false); return; }
    void reload();
    const unsubscribe = subscribeGroupMessages(groupId,
      message => { upsert(message); void markGroupRead(groupId).catch(() => {}); },
      id => setMessages(previous => previous.filter(item => item.id !== id)));
    return unsubscribe;
  }, [groupId, userId, reload, upsert]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true); setError('');
    try {
      const sent = await sendGroupMessage(groupId, text, user.name || authUser?.email || '');
      upsert(sent); setDraft('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Message non envoyé.');
    } finally { setSending(false); }
  }, [draft, sending, groupId, user.name, authUser?.email, upsert]);

  const remove = useCallback(async (id: string) => {
    try { await deleteGroupMessage(id); setMessages(previous => previous.filter(item => item.id !== id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Suppression impossible.'); }
  }, []);

  const report = useCallback(async (id: string) => {
    try { await reportGroupMessage(id, ''); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Signalement impossible.'); return false; }
  }, []);

  const block = useCallback(async (senderId: string) => {
    try { await blockUser(senderId); setBlocked(previous => [...previous, senderId]); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Blocage impossible.'); return false; }
  }, []);

  const visible = messages.filter(message => !blocked.includes(message.sender_id));
  return { userId, messages: visible, loading, sending, error, draft, setDraft, send, remove, report, block, reload };
}
