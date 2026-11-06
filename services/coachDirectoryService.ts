import type { Athlete, ChatChannel, User } from '@/types';
import type { ClubCoach } from '@/services/clubCoachService';

export interface CoachProfile {
  id: string; name: string; role: string; club: string;
  avatar?: string | null; email?: string;
  status?: ClubCoach['status']; groups: string[];
  source: 'club' | 'group';
}
const roleLabels: Record<string, string> = {
  head_coach: 'Entraîneur en chef', assistant_coach: 'Entraîneur assistant',
  sprint_coach: 'Coach sprint', distance_coach: 'Coach demi-fond / fond',
  field_coach: 'Coach lancers / sauts', admin: 'Administrateur',
};
export function buildCoachDirectory(user: User, athletes: Athlete[], channels: ChatChannel[], roster: ClubCoach[]): CoachProfile[] {
  if (user.accountType === 'club' && user.userType !== 'athlete') {
    return roster.map(coach => ({
      id: coach.id, name: coach.name, email: coach.email, role: roleLabels[coach.role] || 'Coach',
      club: user.club, status: coach.status, groups: coach.groupsManaged || [], source: 'club',
    }));
  }
  if (user.userType !== 'athlete') return [];
  const email = user.email.trim().toLowerCase();
  const athlete = athletes.find(item => item.id === user.id)
    || (email ? athletes.find(item => item.email?.trim().toLowerCase() === email) : undefined)
    || athletes.find(item => item.name.trim().toLowerCase() === user.name.trim().toLowerCase());
  // Legacy local onboarding reuses user-1, also present as a demo coach.
  // Only genuine athlete membership can establish a shared-group relationship.
  const ids = new Set(athlete ? [athlete.id] : [user.id]);
  const sharedGroups = channels.filter(channel => channel.members.some(member => member.role === 'athlete' && ids.has(member.id)));
  const directory = new Map<string, CoachProfile>();
  for (const channel of sharedGroups) {
    for (const member of channel.members) {
      if (member.role !== 'coach' || ids.has(member.id)) continue;
      const previous = directory.get(member.id);
      directory.set(member.id, {
        id: member.id, name: member.name, role: 'Coach', club: athlete?.club || user.club,
        avatar: member.avatar, groups: [...new Set([...(previous?.groups || []), channel.name])], source: 'group',
      });
    }
  }
  return [...directory.values()];
}
