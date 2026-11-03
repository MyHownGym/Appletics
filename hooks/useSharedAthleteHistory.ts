import { useMemo } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
export function useSharedAthleteHistory(localId: string) {
 const shared = useSharedGroups();
 const linkedAthletes = shared.data.athletes.filter(item => item.source_id === `${shared.userId}:${localId}`);
 const history = useMemo(() => {
  const ids = new Set(linkedAthletes.map(item => item.id));
  return shared.data.performances.filter(item => ids.has(item.athlete_id)).sort((a,b) => b.updated_at.localeCompare(a.updated_at));
 }, [shared.data.performances,linkedAthletes]);
 return { history, groups: shared.data.groups, sessions: shared.data.sessions };
}
