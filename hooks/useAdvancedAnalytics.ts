import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useLocalDate } from '@/hooks/useLocalDate';
import { Colors } from '@/constants/theme';
import { getAdvancedAnalytics, getAthleteStatusCounts } from '@/services/advancedAnalyticsService';

export function useAthleteStatusCounts() {
  const { athletes } = useApp();
  return useMemo(() => getAthleteStatusCounts(athletes), [athletes]);
}

export function useAdvancedAnalytics() {
  const { athletes, results, competitions, trainingPlans } = useApp();
  const today = useLocalDate();
  return useMemo(() => {
    const stats = getAdvancedAnalytics(athletes, results, competitions, trainingPlans, today);
    return { ...stats, topPerformers: stats.topPerformers.map(d => ({ ...d, color: d.color ?? Colors.primary })) };
  }, [athletes, results, competitions, trainingPlans, today]);
}
