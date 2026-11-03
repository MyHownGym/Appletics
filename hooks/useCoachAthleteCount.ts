import { useMemo, useState } from 'react';
import { parseCoachAthleteCount } from '@/services/athleteCountService';

export function useCoachAthleteCount(initialValue?: number) {
  const [text, setText] = useState(initialValue === undefined ? '' : String(initialValue));
  const result = useMemo(() => parseCoachAthleteCount(text), [text]);
  return { text, setText, ...result };
}
