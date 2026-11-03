import { Athlete, Competition, CompResult, TrainingPlan } from '@/types';
import { EVENT_GROUPS } from '@/constants/config';
import { getLocalDateKey, isValidDateKey } from '@/services/competitionStatusService';

export function getAthleteStatusCounts(athletes: Athlete[]) {
  return { active: athletes.filter(a => a.status === 'active').length,
    injured: athletes.filter(a => a.status === 'injured').length,
    inactive: athletes.filter(a => a.status === 'inactive').length, total: athletes.length };
}

const weekdays: Record<string, number> = { mon: 1, monday: 1, lun: 1, lundi: 1, tue: 2, tuesday: 2, mar: 2, mardi: 2, wed: 3, wednesday: 3, mer: 3, mercredi: 3, thu: 4, thursday: 4, jeu: 4, jeudi: 4, fri: 5, friday: 5, ven: 5, vendredi: 5, sat: 6, saturday: 6, sam: 6, samedi: 6, sun: 0, sunday: 0, dim: 0, dimanche: 0 };

export function getWeeklySessionCounts(plans: TrainingPlan[], today: string) {
  const monday = new Date(`${today}T12:00:00`);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 - 49);
  const dates: string[] = [];
  const counts = Array.from({ length: 8 }, (_, week) => {
    const start = new Date(monday);
    start.setDate(start.getDate() + week * 7);
    dates.push(getLocalDateKey(start));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startKey = getLocalDateKey(start);
    const endKey = getLocalDateKey(end);
    return plans.reduce((total, plan) => total + plan.sessions.filter(session => {
      if (session.type === 'rest') return false;
      if (session.sessionDate && isValidDateKey(session.sessionDate)) return session.sessionDate >= startKey && session.sessionDate <= endKey;
      const weekday = weekdays[session.day?.trim().toLowerCase()];
      if (weekday === undefined || !isValidDateKey(plan.startDate) || !isValidDateKey(plan.endDate)) return false;
      const occurrence = new Date(start);
      occurrence.setDate(start.getDate() + (weekday + 6) % 7);
      const key = getLocalDateKey(occurrence);
      return key >= plan.startDate && key <= plan.endDate;
    }).length, 0);
  });
  const previous = counts.slice(0, 4).reduce((a, b) => a + b, 0);
  const current = counts.slice(4).reduce((a, b) => a + b, 0);
  return { sessionsPerWeek: counts, weekDates: dates, loadChange: previous > 0 ? (current - previous) / previous * 100 : null };
}

export function getAdvancedAnalytics(athletes: Athlete[], results: CompResult[], competitions: Competition[], trainingPlans: TrainingPlan[], today: string) {
  const counts = getAthleteStatusCounts(athletes);
  const groupFor = (athlete?: Athlete) => athlete?.group === 'middle_distance' ? 'distance' : athlete?.group;
  const groupData = EVENT_GROUPS.filter(g => g.id !== 'all').map(g => ({ ...g,
    count: athletes.filter(a => groupFor(a) === g.id).length,
    results: results.filter(r => groupFor(athletes.find(a => a.id === r.athleteId)) === g.id).length,
  })).filter(g => g.count > 0).sort((a, b) => b.count - a.count);
  const topPerformers = athletes.map(a => {
    const entries = results.filter(r => r.athleteId === a.id);
    return { athlete: a, pbs: entries.filter(r => r.pb).length, wins: entries.filter(r => r.rank === 1).length,
      total: entries.length, bestResult: entries[0], color: EVENT_GROUPS.find(g => g.id === groupFor(a))?.color };
  }).filter(d => d.total > 0).sort((a, b) => b.pbs - a.pbs || b.wins - a.wins).slice(0, 5);
  const totalPBs = results.filter(r => r.pb).length;
  return { totalAthletes: counts.total, activeAthletes: counts.active, injuredAthletes: counts.injured,
    inactiveAthletes: counts.inactive, totalResults: results.length, totalPBs,
    totalVictories: results.filter(r => r.rank === 1).length,
    upcomingComps: competitions.filter(c => c.status === 'upcoming').length,
    activePlans: trainingPlans.filter(p => (!p.startDate || p.startDate <= today) && (!p.endDate || p.endDate >= today)).length,
    availabilityRate: counts.total ? Math.round(counts.active / counts.total * 100) : 0,
    pbRate: results.length ? Math.round(totalPBs / results.length * 100) : 0,
    groupData, topPerformers, ...getWeeklySessionCounts(trainingPlans, today) };
}
