import { useCallback, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useApp } from '@/hooks/useApp';
import { createTrainingGroup } from '@/services/trainingGroups';
export function useSharedGroupsPage() {
 const shared = useSharedGroups(); const { user } = useApp();
 const [name, setName] = useState(''); const [discipline, setDiscipline] = useState('sprints');
 const create = useCallback(async () => { if (!name.trim()) return; try { const id = await createTrainingGroup(shared.operate, name, discipline); setName(''); return id; } catch { return undefined; } }, [name, discipline, shared.operate]);
 const answer = useCallback(async (id: string, accept: boolean) => { try { await shared.operate('shared_answer_invitation', { p_invitation: id, p_accept: accept }); } catch {} }, [shared.operate]);
 return { ...shared, name, setName, discipline, setDiscipline, create, answer, canCreate: user.userType === 'coach', invitations: shared.data.invitations.filter(item => item.status === 'pending' && item.email.toLowerCase() === shared.email.toLowerCase() && new Date(item.expires_at).getTime() > Date.now()) };
}
