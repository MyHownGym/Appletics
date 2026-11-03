import { useCallback, useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { getCoachRoleLabel, getCoachRoleOptions } from '@/services/coachRoleService';

export function useCoachRoles() {
  const { language } = useI18n();
  const roles = useMemo(() => getCoachRoleOptions(language), [language]);
  const roleLabel = useCallback((role: string) => getCoachRoleLabel(role, language), [language]);
  return { roles, roleLabel };
}
