import type { TrainingPlan } from '@/types';

const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Last day of a plan: its end date, otherwise start + number of weeks.
export function planEndDate(plan: TrainingPlan): string {
  if (plan.endDate) return plan.endDate.slice(0, 10);
  if (!plan.startDate || !plan.weeks) return '';
  const end = new Date(`${plan.startDate.slice(0, 10)}T12:00:00`);
  end.setDate(end.getDate() + plan.weeks * 7 - 1);
  return day(end);
}

// Finished: its last day is before today.
export const isPlanFinished = (plan: TrainingPlan, today = day(new Date())) => { const end = planEndDate(plan); return !!end && end < today; };
