import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getLocalDateKey } from '@/services/competitionStatusService';

export function useLocalDate() {
  const [today, setToday] = useState(() => getLocalDateKey());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      setToday(getLocalDateKey());
      const next = new Date();
      next.setHours(24, 0, 0, 100);
      timer = setTimeout(refresh, Math.max(100, next.getTime() - Date.now()));
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);
  return today;
}
