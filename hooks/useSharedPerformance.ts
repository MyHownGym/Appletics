import { useCallback, useMemo, useState } from 'react';
import { useAlert } from '@/template';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import type { SessionMetric } from '@/types';
import type { SharedPerformance } from '@/types/sharedGroups';
export function useSharedPerformance(sessionId: string, initialMetrics?: SessionMetric[], initialDate?: string, initialNotes = '') {
 const shared = useSharedGroups(); const { showAlert } = useAlert(); const { translate } = useLocalizedCopy();
 const session = shared.data.sessions.find(item => item.id === sessionId);
 const groupId = session?.group_id ?? '';
 const coach = shared.data.members.some(item => item.group_id === groupId && item.user_id === shared.userId && item.role === 'coach');
 const athletes = shared.data.athletes.filter(item => item.group_id === groupId && (coach || item.user_id === shared.userId));
 const performances = useMemo(() => shared.data.performances.filter(item => item.session_id === sessionId).sort((a,b) => b.updated_at.localeCompare(a.updated_at)), [shared.data.performances, sessionId]);
 const [open, setOpen] = useState(false);
 const [target, setTarget] = useState('');
 const [metrics, setMetrics] = useState<SessionMetric[]>([{ label: '', value: '', unit: 's' }]);
 const [notes, setNotes] = useState('');
 const [date, setDate] = useState('');
 const [version, setVersion] = useState(0);
 const [error, setError] = useState('');
 const [message, setMessage] = useState('');
 const begin = useCallback((existing?: SharedPerformance) => {
  const firstTarget = existing?.athlete_id ?? athletes[0]?.id ?? '';
  const previous = existing ?? performances.find(item => item.athlete_id === firstTarget);
  setTarget(firstTarget); setVersion(previous?.version ?? 0); setMetrics(previous?.metrics.map(item => ({ ...item })) ?? initialMetrics?.map(item => ({ ...item })) ?? [{ label: '', value: '', unit: 's' }]); setNotes(previous?.notes ?? initialNotes); setDate(previous?.performed_on ?? initialDate ?? session?.session_date ?? new Date().toISOString().slice(0,10)); setError(''); setMessage(''); setOpen(true);
 }, [athletes, performances, initialMetrics, initialDate, initialNotes, session?.session_date]);
 const chooseAthlete = useCallback((id: string) => {
  const previous = performances.find(item => item.athlete_id === id);
  setTarget(id); setVersion(previous?.version ?? 0); setMetrics(previous?.metrics.map(item => ({ ...item })) ?? [{ label: '', value: '', unit: 's' }]); setNotes(previous?.notes ?? ''); setDate(previous?.performed_on ?? session?.session_date ?? new Date().toISOString().slice(0,10)); setError('');
 }, [performances, session?.session_date]);
 const updateMetric = useCallback((index: number, field: keyof SessionMetric, value: string) => setMetrics(previous => previous.map((item,i) => i === index ? { ...item, [field]: value } : item)), []);
 const addMetric = useCallback(() => setMetrics(previous => previous.length < 30 ? [...previous, { label: '', value: '', unit: 's' }] : previous), []);
 const removeMetric = useCallback((index: number) => setMetrics(previous => previous.length > 1 ? previous.filter((_,i) => i !== index) : previous), []);
 const close = useCallback(() => { if (!shared.busy) setOpen(false); }, [shared.busy]);
 const valid = !!target && /^\d{4}-\d{2}-\d{2}$/.test(date) && metrics.length > 0 && metrics.every(item => item.label.trim() && item.value.trim() && item.unit.trim());
 const save = useCallback(async () => {
  if (!valid || shared.busy) return;
  setError('');
  try { await shared.savePerformance(sessionId,target,date,metrics,notes,version); setOpen(false); setMessage('Enregistré dans le groupe.'); }
  catch (reason) { setError(reason instanceof Error ? reason.message : 'Opération impossible. Vérifiez les informations et votre connexion.'); }
 }, [valid, shared.busy, shared.savePerformance, sessionId, target, date, metrics, notes, version]);
 const remove = useCallback((performance: SharedPerformance) => {
  showAlert(translate('Supprimer la performance ?'), translate('Cette suppression sera visible dans le groupe.'), [{ text: translate('Annuler'), style: 'cancel' }, { text: translate('Supprimer'), style: 'destructive', onPress: () => { void shared.operate('shared_delete_performance', { p_id: performance.id, p_version: performance.version }).catch(() => {}); } }]);
 }, [showAlert, translate, shared.operate]);
 const author = useCallback((id: string) => shared.data.members.find(item => item.group_id === groupId && item.user_id === id)?.display_name ?? translate('Ancien membre'), [shared.data.members, groupId, translate]);
 return { session, groupId, coach, athletes, performances, open, target, metrics, notes, setNotes, date, setDate, version, error, message, begin, chooseAthlete, updateMetric, addMetric, removeMetric, close, valid, save, remove, author, busy: shared.busy, syncError: shared.error };
}
