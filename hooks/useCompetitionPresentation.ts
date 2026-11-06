import { useMemo } from 'react';
import { Competition } from '@/types';
import { useI18n } from '@/hooks/useI18n';
import { getCompetitionPresentation } from '@/services/competitionPresentationService';

export function useCompetitionPresentation(competition: Competition) {
  const { language } = useI18n();
  return useMemo(() => getCompetitionPresentation(competition, language), [competition, language]);
}
