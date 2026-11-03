import { useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useLocalDate } from '@/hooks/useLocalDate';
import { getCompetitionStatus, isValidDateKey } from '@/services/competitionStatusService';

export function useCompetitionSchedule(date: string, endDate: string, cancelled: boolean) {
  const today = useLocalDate();
  const { t } = useI18n();
  return useMemo(() => ({
    status: getCompetitionStatus({ date, endDate, status: cancelled ? 'cancelled' : 'upcoming' }, today),
    dateError: date && !isValidDateKey(date) ? t('Date de début invalide.')
      : endDate && !isValidDateKey(endDate) ? t('Date de fin invalide.')
      : date && endDate && endDate < date ? t('La date de fin doit être égale ou postérieure à la date de début.') : '',
  }), [date, endDate, cancelled, today, t]);
}
