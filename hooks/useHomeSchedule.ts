import { useCallback, useMemo, useState } from 'react';
import { useActivityScope } from '@/hooks/useActivityScope';
import { useLocalDate } from '@/hooks/useLocalDate';
import { useI18n } from '@/hooks/useI18n';
import { scheduleEntries, entriesForDate, monthCells } from '@/services/homeScheduleService';
export function useHomeSchedule() {
  const { trainingPlans, competitions } = useActivityScope();
  const { t, locale } = useI18n();
  const today = useLocalDate();
  const [month, setMonth] = useState(() => new Date(`${today.slice(0, 7)}-01T12:00:00`));
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const entries = useMemo(() => scheduleEntries(trainingPlans), [trainingPlans]);
  const sessions = useMemo(() => entriesForDate(entries, today), [entries, today]);
  const cells = useMemo(() => monthCells(month, entries, competitions), [month, entries, competitions]);
  const selectedSessions = useMemo(() => selectedDate ? entriesForDate(entries, selectedDate) : [], [entries, selectedDate]);
  const selectedCompetitions = useMemo(() => competitions.filter(item => item.date === selectedDate), [competitions, selectedDate]);
  const upcoming = useMemo(() => competitions.filter(item => item.status === 'upcoming').slice(0, 2), [competitions]);
  const changeMonth = useCallback((offset: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1)), []);
  const toggleCalendar = useCallback(() => { setShowCalendar(current => !current); setSelectedDate(null); }, []);
  return { today, sessions, cells, month, showCalendar, selectedDate, setSelectedDate, selectedSessions, selectedCompetitions, upcoming, changeMonth, toggleCalendar,
    monthTitle: month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    dayLabels: ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'].map(t),
    dateLabel: new Date(`${today}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    selectedLabel: selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
  };
}
