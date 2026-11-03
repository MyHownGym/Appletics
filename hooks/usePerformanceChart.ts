import { useCallback, useMemo, useState } from 'react';
import { Competition, CompResult } from '@/types';
import { normalizeEvent, parsePerf, isDistanceEvent, sortResultsChronologically } from '@/services/athletePerformanceService';

export function usePerformanceChart(results: CompResult[], event: string, competitions: Competition[]) {
  const [containerWidth, setContainerWidth] = useState(280);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onWidthChange = useCallback((width: number) => setContainerWidth(Math.max(1, width)), []);
  const orderedResults = useMemo(() => sortResultsChronologically(results.filter(result =>
    normalizeEvent(result.event) === normalizeEvent(event) && parsePerf(result.result) !== null
  ), competitions), [results, event, competitions]);
  const values = useMemo(() => orderedResults.map(result => parsePerf(result.result) as number), [orderedResults]);
  const isDistance = isDistanceEvent(event);
  const width = Math.max(1, containerWidth, 100 + Math.max(1, values.length - 1) * 64);
  const plotLeft = 72;
  const plotRight = width - 24;
  const plotTop = 24;
  const plotBottom = 176;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = Math.max((max - min) * 0.15, 0.02);
  const lower = Math.max(0, min - padding);
  const upper = max + padding;
  const range = Math.max(0.001, upper - lower);
  // Numeric Y axis: largest values at the top, smallest chronos at the bottom.
  const yForValue = (value: number) => plotBottom - ((value - lower) / range) * (plotBottom - plotTop);
  const points = values.map((value, index) => ({
    x: plotLeft + (index / Math.max(1, values.length - 1)) * Math.max(1, plotRight - plotLeft),
    y: yForValue(value), value, result: orderedResults[index],
  }));
  const selectedResult = orderedResults.find(result => result.id === selectedId) ?? orderedResults[orderedResults.length - 1] ?? null;
  const selectedCompetition = competitions.find(competition => competition.id === selectedResult?.competitionId);
  const ticks = [upper, (upper + lower) / 2, lower].map(value => ({
    y: yForValue(value),
    label: isDistance ? `${value.toFixed(2)} m` : value < 60 ? `${value.toFixed(2)} s` : `${Math.floor(value / 60)}:${(value % 60).toFixed(2).padStart(5, '0')}`,
  }));
  return { orderedResults, points, ticks, width, plotLeft, plotRight, plotTop, plotBottom, isDistance, selectedResult, selectedCompetition, onWidthChange, selectResult: setSelectedId };
}
