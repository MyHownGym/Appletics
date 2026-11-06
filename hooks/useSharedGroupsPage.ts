import { useCallback, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useApp } from '@/hooks/useApp';
export function useSharedGroupsPage() {
 const shared = useSharedGroups(); const { user } = useApp();
 const [name, setName] = useState('');
 const create = useCallback(async () => { if (!name.trim()) return; try { const id = await shared.operate<string>('shared_create_group', { p_name: name.trim() }); setName(''); return id; } catch { return undefined; } }, [name, shared.operate]);
 const answer = useCallback(async (id: string, accept: boolean) => { try { await shared.operate('shared_answer_invitation', { p_invitation: id, p_accept: accept }); } catch {} }, [shared.operate]);
 return { ...shared, name, setName, create, answer, canCreate: user.userType === 'coach', invitations: shared.data.invitations.filter(item => item.status === 'pending' && item.email.toLowerCase() === shared.email.toLowerCase() && new Date(item.expires_at).getTime() > Date.now()) };
}
