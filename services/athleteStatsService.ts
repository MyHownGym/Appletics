import { Competition, CompResult } from '@/types';
import { isBetterPerformance, isDistanceEvent, normalizeEvent, parsePerf } from '@/services/athletePerformanceService';

export type AthleteSeason = number | null;

// Seasons follow the competition date, not the date a result was entered.
// Undated results remain visible under "Toutes" but are never assigned a guessed year.
export function getCompetitionYear(date?: string): number | null {
  const match = date?.match(/^(\d{4})-\d{2}-\d{2}/);
  if (!match) return null;
  const year = Number(match[1]);
  return year > 0 ? year : null;
}

export function getAthleteSeasonStats(
  athleteResults: CompResult[],
  competitions: Competition[],
  selectedSeason: AthleteSeason,
  currentYear: number,
) {
  const yearsByCompetition = new Map(competitions.map(competition => [competition.id, getCompetitionYear(competition.date)]));
  const inYear = (result: CompResult, year: number) => yearsByCompetition.get(result.competitionId) === year;
  const seasonResults = selectedSeason === null ? athleteResults : athleteResults.filter(result => inYear(result, selectedSeason));
  const eventsByKey = new Map<string, string>();
  const seasonEventCounts: Record<string, number> = {};
  seasonResults.forEach(result => {
    const key = normalizeEvent(result.event);
    if (!key) return;
    if (!eventsByKey.has(key)) eventsByKey.set(key, result.event);
    seasonEventCounts[key] = (seasonEventCounts[key] ?? 0) + 1;
  });
  const seasonEvents = [...eventsByKey.values()];
  const comparisonYear = selectedSeason ?? currentYear;
  const comparisonPrevYear = comparisonYear - 1;
  const currentEntries = athleteResults.filter(result => inYear(result, comparisonYear));
  const previousEntries = athleteResults.filter(result => inYear(result, comparisonPrevYear));
  const comparisonEvents = new Map<string, string>();
  [...previousEntries, ...currentEntries].forEach(result => comparisonEvents.set(normalizeEvent(result.event), result.event));
  const bestFor = (entries: CompResult[], event: string) => entries
    .filter(result => normalizeEvent(result.event) === normalizeEvent(event) && parsePerf(result.result) !== null)
    .reduce<string | null>((best, result) => !best || isBetterPerformance(event, result.result, best) ? result.result : best, null);
  const comparisons = [...comparisonEvents.values()].flatMap(event => {
    const current = bestFor(currentEntries, event);
    const previous = bestFor(previousEntries, event);
    if (!current || !previous) return [];
    const currentValue = parsePerf(current) as number;
    const previousValue = parsePerf(previous) as number;
    return [{ event, current, previous, better: isBetterPerformance(event, current, previous),
      change: Math.abs(currentValue - previousValue) / previousValue * 100, isDistance: isDistanceEvent(event) }];
  });
  return {
    seasonResults,
    seasonEvents,
    seasonEventCounts,
    seasonWins: seasonResults.filter(result => result.rank === 1).length,
    seasonPbs: seasonResults.filter(result => result.pb).length,
    seasonCompetitionCount: new Set(seasonResults.map(result => result.competitionId)).size,
    comparisonYear,
    comparisonPrevYear,
    comparisons,
  };
}
