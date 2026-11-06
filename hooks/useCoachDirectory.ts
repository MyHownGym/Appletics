import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { buildCoachDirectory } from '@/services/coachDirectoryService';
export function useCoachDirectory() {
  const { user, athletes, channels } = useApp();
  const { coaches: roster, loading } = useClubCoaches();
  const coaches = useMemo(() => buildCoachDirectory(user, athletes, channels, roster), [user, athletes, channels, roster]);
  return { coaches, loading, isClub: user.accountType === 'club' && user.userType !== 'athlete' };
}
