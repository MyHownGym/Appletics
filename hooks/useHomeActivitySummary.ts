import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useActivityScope } from '@/hooks/useActivityScope';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { useLocalDate } from '@/hooks/useLocalDate';
import { useSharedGroups } from '@/hooks/useSharedGroups';

export function useHomeActivitySummary() {
  const router = useRouter();
  const { user, athletes } = useApp();
  const scope = useActivityScope();
  const { coaches, loading } = useClubCoaches();
  const today = useLocalDate();
  const shared = useSharedGroups();
  const isAthlete = user.userType === 'athlete';
  const isClub = user.accountType === 'club';
  const activePlans = useMemo(() => scope.trainingPlans.filter(plan => (!plan.startDate || plan.startDate <= today) && (!plan.endDate || plan.endDate >= today)).length, [scope.trainingPlans, today]);
  return {
    isAthlete, isClub, athleteCount: athletes.length, coachCount: loading ? '…' : String(coaches.length),
    planCount: isClub ? activePlans : scope.trainingPlans.length,
    competitionCount: isAthlete ? scope.competitions.length : scope.competitions.filter(competition => competition.status === 'upcoming').length,
    // Online group chats (one per group) + chats kept on this device.
    chatCount: shared.data.groups.length,
    openAthletes: useCallback(() => router.push({ pathname: '/(tabs)/profile', params: { section: 'athletes', focusId: String(Date.now()) } }), [router]),
    openCoaches: useCallback(() => router.push('/club-admin'), [router]),
    openPlans: useCallback(() => router.push('/(tabs)/plans'), [router]),
    openCompetitions: useCallback(() => router.push('/(tabs)/competitions'), [router]),
    openChat: useCallback(() => router.push('/(tabs)/chat'), [router]),
  };
}
