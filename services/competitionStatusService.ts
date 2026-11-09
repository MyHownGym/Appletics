import { Competition } from '@/types';

export function getLocalDateKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && getLocalDateKey(date) === value;
}

// Keep the competition available through its last day. Cancellation is the only manual override.
export function getCompetitionStatus(
  competition: Pick<Competition, 'date' | 'endDate' | 'status'>,
  today: string = getLocalDateKey(),
): Competition['status'] {
  if (competition.status === 'cancelled') return 'cancelled';
  if (!isValidDateKey(competition.date)) return 'upcoming';
  const lastDay = competition.endDate && isValidDateKey(competition.endDate) && competition.endDate >= competition.date
    ? competition.endDate : competition.date;
  return lastDay < today ? 'completed' : 'upcoming';
}

export function withAutomaticCompetitionStatus(competition: Competition, today: string = getLocalDateKey()): Competition {
  const status = getCompetitionStatus(competition, today);
  return status === competition.status ? competition : { ...competition, status };
}

// Display only: an upcoming competition is « en cours » from its first to its last day.
export function isCompetitionOngoing(competition: Pick<Competition, 'date' | 'endDate' | 'status'>, today: string = getLocalDateKey()): boolean {
  if (competition.status === 'cancelled' || !isValidDateKey(competition.date)) return false;
  const lastDay = competition.endDate && isValidDateKey(competition.endDate) && competition.endDate >= competition.date ? competition.endDate : competition.date;
  return competition.date <= today && today <= lastDay;
}
