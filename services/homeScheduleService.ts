import type { Competition, TrainingPlan, TrainingSession } from '@/types';
export interface ScheduleEntry { session: TrainingSession; planId: string; planTitle: string }
export function scheduleEntries(plans: TrainingPlan[]): ScheduleEntry[] { return plans.flatMap(plan => plan.sessions.map(session => ({ session, planId: plan.id, planTitle: plan.title }))); }
export function entriesForDate(entries: ScheduleEntry[], key: string): ScheduleEntry[] {
  const day = (new Date(`${key}T12:00:00`).getDay() + 6) % 7;
  const english = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const french = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  return entries.filter(entry => entry.session.sessionDate ? entry.session.sessionDate === key : entry.session.day === english[day] || entry.session.day === french[day]);
}
export function monthCells(month: Date, entries: ScheduleEntry[], competitions: Competition[]) {
  const year = month.getFullYear();
  const index = month.getMonth();
  const offset = (new Date(year, index, 1).getDay() + 6) % 7;
  const count = new Date(year, index + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, position) => {
    const day = position - offset + 1;
    if (day < 1 || day > count) return null;
    const key = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, key, sessions: entriesForDate(entries, key), competition: competitions.some(item => item.date === key) };
  });
}
