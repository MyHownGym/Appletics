import { Athlete, Competition, CompResult } from '@/types';

export function normalizeEvent(event: string): string {
  return event.trim().toLocaleLowerCase().replace(/\s+/g, '').replace(/mètres|metres/g, 'm');
}

export function parsePerf(performance: string): number | null {
  const text = performance.trim().toLowerCase().replace(/,/g, '.');
  const hours = text.match(/^(\d+)h(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (hours) return Number(hours[1]) * 3600 + Number(hours[2]) * 60 + Number(hours[3]);
  const time = text.replace(/\s*s$/, '').split(':');
  if (time.length === 2 || time.length === 3) {
    if (!time.every(part => /^\d+(?:\.\d+)?$/.test(part))) return null;
    const value = time.reduce((total, part) => total * 60 + Number(part), 0);
    return value > 0 && Number.isFinite(value) ? value : null;
  }
  if (!/^\d+(?:\.\d+)?\s*(?:m|cm|s|pts|points)?$/.test(text)) return null;
  const value = parseFloat(text);
  return value > 0 && Number.isFinite(value) ? value : null;
}

export function isDistanceEvent(event: string): boolean {
  return /saut|lancer|longueur|triple|hauteur|perche|poids|disque|marteau|javelot|jump|vault|throw|shot|discus|hammer|javelin|sprung|wurf|salto|lancio|lançamento|decat|heptat|pentat|points/i.test(event);
}

export function isBetterPerformance(event: string, candidate: string, reference?: string): boolean {
  const value = parsePerf(candidate);
  const previous = reference ? parsePerf(reference) : null;
  if (value === null) return false;
  if (previous === null) return true;
  return isDistanceEvent(event) ? value > previous : value < previous;
}

export function getPersonalBests(athlete: Athlete, results: CompResult[]): Record<string, string> {
  const best: Record<string, string> = {};
  const add = (event: string, performance: string) => {
    if (!event.trim() || !performance.trim()) return;
    const key = Object.keys(best).find(existing => normalizeEvent(existing) === normalizeEvent(event)) ?? event.trim();
    if (!best[key] || isBetterPerformance(event, performance, best[key])) best[key] = performance.trim();
  };
  Object.entries(athlete.manualPb ?? athlete.pb).forEach(([event, performance]) => add(event, performance));
  results.filter(result => result.athleteId === athlete.id && parsePerf(result.result) !== null)
    .forEach(result => add(result.event, result.result));
  return best;
}

export function reconcileAthletes(athletes: Athlete[], results: CompResult[]): Athlete[] {
  return athletes.map(athlete => {
    const manualPb = athlete.manualPb ?? Object.fromEntries(Object.entries(athlete.pb).filter(([event, performance]) => {
      // A legacy PB equal to a recorded result comes from that result, not an independent baseline.
      // Correcting that result must not restore its old performance as a manual PB.
      return !results.some(result => result.athleteId === athlete.id
        && normalizeEvent(result.event) === normalizeEvent(event)
        && parsePerf(result.result) !== null && parsePerf(result.result) === parsePerf(performance));
    }));
    return { ...athlete, manualPb, pb: getPersonalBests({ ...athlete, manualPb }, results) };
  });
}

export function resultWithPb(result: CompResult, athletes: Athlete[], results: CompResult[]): CompResult {
  const athlete = athletes.find(item => item.id === result.athleteId);
  if (!athlete) return result;
  const best = getPersonalBests(athlete, results.filter(item => item.id !== result.id));
  const key = Object.keys(best).find(event => normalizeEvent(event) === normalizeEvent(result.event));
  return { ...result, pb: result.pb || isBetterPerformance(result.event, result.result, key ? best[key] : undefined) };
}

export function sortResultsChronologically(results: CompResult[], competitions: Competition[]): CompResult[] {
  const dates = new Map(competitions.map(competition => [competition.id, competition.date]));
  return results.map((result, index) => ({ result, index }))
    .sort((a, b) => (dates.get(a.result.competitionId) ?? '').localeCompare(dates.get(b.result.competitionId) ?? '') || b.index - a.index)
    .map(entry => entry.result);
}

export function resultScore(rank: number): number {
  return rank > 0 ? Math.max(0, 4 - rank) : 0;
}
