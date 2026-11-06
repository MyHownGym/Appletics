import { useCallback, useMemo, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useApp } from '@/hooks/useApp';
export function useSharedGroupManagement(groupId: string) {
 const shared = useSharedGroups(); const { athletes: localAthletes } = useApp();
 const [coachEmail, setCoachEmail] = useState('');
 const [athleteEmail, setAthleteEmail] = useState('');
 const [athleteName, setAthleteName] = useState('');
 const [inviteAthleteId, setInviteAthleteId] = useState('');
 const [message, setMessage] = useState('');
 const group = shared.data.groups.find(item => item.id === groupId);
 const coach = shared.data.members.some(item => item.group_id === groupId && item.user_id === shared.userId && item.role === 'coach');
 const members = shared.data.members.filter(item => item.group_id === groupId);
 const athletes = shared.data.athletes.filter(item => item.group_id === groupId);
 const sessions = useMemo(() => shared.data.sessions.filter(item => item.group_id === groupId).sort((a,b) => b.session_date.localeCompare(a.session_date)), [shared.data.sessions, groupId]);
 const invitations = shared.data.invitations.filter(item => item.group_id === groupId && item.status === 'pending' && new Date(item.expires_at).getTime() > Date.now());
 const run = useCallback(async (name: string, parameters: Record<string, unknown>, success = '') => { setMessage(''); try { await shared.operate(name, parameters); setMessage(success); return true; } catch { return false; } }, [shared.operate]);
 const inviteCoach = useCallback(async () => { if (await run('shared_invite', { p_group: groupId, p_email: coachEmail.trim(), p_role: 'coach' }, 'Invitation enregistrée. Elle apparaît dans Groupes partagés pour ce compte e-mail.')) setCoachEmail(''); }, [run, groupId, coachEmail]);
 const inviteAthlete = useCallback(async () => { if (await run('shared_invite', { p_group: groupId, p_email: athleteEmail.trim(), p_role: 'athlete', p_athlete: inviteAthleteId }, 'Invitation enregistrée. Elle apparaît dans Groupes partagés pour ce compte e-mail.')) { setAthleteEmail(''); setInviteAthleteId(''); } }, [run, groupId, athleteEmail, inviteAthleteId]);
 const addAthlete = useCallback(async (name = athleteName, source: string | null = null) => { if (await run('shared_add_athlete', { p_group: groupId, p_name: name.trim(), p_source: source ? `${shared.userId}:${source}` : null })) setAthleteName(''); }, [run, groupId, athleteName, shared.userId]);
 const revoke = useCallback((id: string) => run('shared_revoke_invitation', { p_invitation: id }), [run]);
 const removeMember = useCallback((id: string) => run('shared_remove_member', { p_group: groupId, p_user: id }), [run, groupId]);
 return { ...shared, group, coach, members, athletes, sessions, invitations, localAthletes, coachEmail, setCoachEmail, athleteEmail, setAthleteEmail, athleteName, setAthleteName, inviteAthleteId, setInviteAthleteId, message, inviteCoach, inviteAthlete, addAthlete, revoke, removeMember };
}
