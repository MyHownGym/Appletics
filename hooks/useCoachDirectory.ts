import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { buildCoachDirectory, type CoachProfile } from '@/services/coachDirectoryService';
export function useCoachDirectory() {
  const { user, athletes, channels } = useApp();
  const { coaches: roster, loading } = useClubCoaches();
  const shared = useSharedGroups();
  const coaches = useMemo(() => {
    const local = buildCoachDirectory(user, athletes, channels, roster);
    // Coaches of the groups this account belongs to (one entry per coach, even across several groups).
    const myGroups = new Set(shared.data.members.filter(item => item.user_id === shared.userId).map(item => item.group_id));
    const seen = new Set(local.map(coach => coach.name.trim().toLowerCase()));
    const online = shared.data.members
      .filter(item => myGroups.has(item.group_id) && item.role === 'coach' && item.user_id !== shared.userId)
      .filter((item, index, list) => list.findIndex(other => other.user_id === item.user_id) === index)
      .filter(item => !seen.has(item.display_name.trim().toLowerCase()))
      .map((item): CoachProfile => { const group = shared.data.groups.find(entry => entry.id === item.group_id)?.name ?? ''; return { id: `shared-coach-${item.user_id}`, name: item.display_name || 'Coach', role: 'Coach', club: group, avatar: item.avatar ?? null, status: 'active', groups: group ? [group] : [], source: 'group' }; });
    return [...local, ...online];
  }, [user, athletes, channels, roster, shared.data.members, shared.data.groups, shared.userId]);
  return { coaches, loading, isClub: user.accountType === 'club' && user.userType !== 'athlete' };
}
