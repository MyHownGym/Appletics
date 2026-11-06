import { useCallback, useMemo, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { sendInvitationEmail } from '@/services/inviteEmailService';
import { appUrl } from '@/constants/links';
export function useSharedGroupManagement(groupId: string) {
 const shared = useSharedGroups(); const { athletes: localAthletes } = useApp(); const { language } = useI18n();
 const [coachEmail, setCoachEmail] = useState('');
 const [athleteEmail, setAthleteEmail] = useState('');
 const [athleteName, setAthleteName] = useState('');
 const [inviteAthleteId, setInviteAthleteId] = useState('');
 const [message, setMessage] = useState('');
 const [newAthleteName, setNewAthleteName] = useState('');
 const [newAthleteEmail, setNewAthleteEmail] = useState('');
 const group = shared.data.groups.find(item => item.id === groupId);
 const coach = shared.data.members.some(item => item.group_id === groupId && item.user_id === shared.userId && item.role === 'coach');
 const members = shared.data.members.filter(item => item.group_id === groupId);
 const athletes = shared.data.athletes.filter(item => item.group_id === groupId);
 const sessions = useMemo(() => shared.data.sessions.filter(item => item.group_id === groupId).sort((a,b) => b.session_date.localeCompare(a.session_date)), [shared.data.sessions, groupId]);
 const invitations = shared.data.invitations.filter(item => item.group_id === groupId && item.status === 'pending' && new Date(item.expires_at).getTime() > Date.now());
 const run = useCallback(async (name: string, parameters: Record<string, unknown>, success = '') => { setMessage(''); try { await shared.operate(name, parameters); setMessage(success); return true; } catch { return false; } }, [shared.operate]);
  // Creates the invitation, then sends the e-mail from the server. If the e-mail fails, the invitation stays valid
 // and the coach gets the app link to share another way.
 const invite = useCallback(async (email: string, role: 'coach' | 'athlete', athleteId = '') => {
  setMessage('');
  const address = email.trim().toLowerCase();
  let id = '';
  try { id = await shared.operate<string>('shared_invite', { p_group: groupId, p_email: address, p_role: role, ...(role === 'athlete' ? { p_athlete: athleteId } : {}) }); } catch { return false; }
  const failure = id ? await sendInvitationEmail(id, language) : 'L’e-mail n’a pas pu être envoyé.';
  setMessage(failure ? `Invitation enregistrée pour ${address}, mais l’e-mail n’est pas parti (${failure}). Envoyez-lui ce lien : ${appUrl}` : `Invitation envoyée par e-mail à ${address}.`);
  return true;
 }, [shared.operate, groupId, language]);
 // New athlete in one step: create the group athlete card, then invite this e-mail for it.
 const inviteNewAthlete = useCallback(async () => {
  if (!newAthleteName.trim() || !newAthleteEmail.trim()) return;
  let athleteId = '';
  try { athleteId = await shared.operate<string>('shared_add_athlete', { p_group: groupId, p_name: newAthleteName.trim(), p_source: null }); } catch { return; }
  if (await invite(newAthleteEmail, 'athlete', athleteId)) { setNewAthleteEmail(''); setNewAthleteName(''); }
 }, [shared.operate, groupId, newAthleteName, newAthleteEmail, invite]);
 const inviteCoach = useCallback(async () => { if (await invite(coachEmail, 'coach')) setCoachEmail(''); }, [invite, coachEmail]);
 const inviteAthlete = useCallback(async () => { if (await invite(athleteEmail, 'athlete', inviteAthleteId)) { setAthleteEmail(''); setInviteAthleteId(''); } }, [invite, athleteEmail, inviteAthleteId]);
 const addAthlete = useCallback(async (name = athleteName, source: string | null = null) => { if (await run('shared_add_athlete', { p_group: groupId, p_name: name.trim(), p_source: source ? `${shared.userId}:${source}` : null })) setAthleteName(''); }, [run, groupId, athleteName, shared.userId]);
 const revoke = useCallback((id: string) => run('shared_revoke_invitation', { p_invitation: id }), [run]);
 const removeMember = useCallback((id: string) => run('shared_remove_member', { p_group: groupId, p_user: id }), [run, groupId]);
 return { ...shared, group, coach, members, athletes, sessions, invitations, localAthletes, coachEmail, setCoachEmail, athleteEmail, setAthleteEmail, athleteName, setAthleteName, inviteAthleteId, setInviteAthleteId, message, inviteCoach, inviteNewAthlete, newAthleteName, setNewAthleteName, newAthleteEmail, setNewAthleteEmail, inviteAthlete, addAthlete, revoke, removeMember };
}
