import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { getActivityScope } from '@/services/activityScopeService';

export function useActivityScope() {
  const { user, athletes, trainingPlans, competitions, channels, results } = useApp();
  return useMemo(() => getActivityScope({ user, athletes, trainingPlans, competitions, channels, results }),
    [user, athletes, trainingPlans, competitions, channels, results]);
}
