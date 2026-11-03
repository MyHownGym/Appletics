import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/template';
import { emptySharedData, type SharedData, type SharedPerformance } from '@/types/sharedGroups';
import { loadSharedData, sharedOperation, saveSharedPerformance } from '@/services/sharedGroupsService';
import type { SessionMetric } from '@/types';
interface SharedGroupsState {
 data: SharedData; loading: boolean; busy: boolean; error: string; userId: string; email: string; refresh: () => Promise<void>;
 operate: <T = unknown>(name: string, parameters: Record<string, unknown>) => Promise<T>;
 savePerformance: (session: string, athlete: string, date: string, metrics: SessionMetric[], notes: string, version?: number) => Promise<SharedPerformance>;
}
export const SharedGroupsContext = createContext<SharedGroupsState | undefined>(undefined);
export function SharedGroupsProvider({ children }: { children: ReactNode }) {
 const { user } = useAuth();
 const userId = user?.id ?? '';
 const [snapshot, setSnapshot] = useState<{ userId: string; data: SharedData }>({ userId: '', data: emptySharedData });
 const [loading, setLoading] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const identity = useRef(userId); identity.current = userId;
 const mutation = useRef(false);
 const revision = useRef(0);
 const request = useRef(0);
 const refresh = useCallback(async () => {
  if (!userId) return;
  const sequence = ++request.current;
  const startRevision = revision.current;
  try { const data = await loadSharedData(); if (identity.current === userId && sequence === request.current && startRevision === revision.current) { setSnapshot({ userId, data }); setError(''); } }
  catch (reason) { if (identity.current === userId && sequence === request.current) setError(reason instanceof Error ? reason.message : 'Impossible de synchroniser les groupes. Vérifiez votre connexion.'); }
  finally { if (identity.current === userId && sequence === request.current) setLoading(false); }
 }, [userId]);
 useEffect(() => {
  setSnapshot({ userId, data: emptySharedData }); setError(''); setBusy(false); setLoading(!!userId); revision.current++;
  if (!userId) return;
  void refresh();
  const timer = setInterval(() => { if (AppState.currentState === 'active' && !mutation.current) void refresh(); }, 15000);
  const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
  return () => { clearInterval(timer); subscription.remove(); request.current++; };
 }, [userId, refresh]);
 const operate = useCallback(async <T,>(name: string, parameters: Record<string, unknown>): Promise<T> => {
  if (!userId || mutation.current) throw new Error('Opération impossible. Vérifiez les informations et votre connexion.');
  mutation.current = true; setBusy(true); setError(''); revision.current++;
  try { const result = await sharedOperation<T>(name, parameters); if (identity.current !== userId) throw new Error('Opération impossible. Vérifiez les informations et votre connexion.'); revision.current++; await refresh(); return result; }
  catch (reason) { if (identity.current === userId) setError(reason instanceof Error ? reason.message : 'Opération impossible. Vérifiez les informations et votre connexion.'); throw reason; }
  finally { mutation.current = false; if (identity.current === userId) setBusy(false); }
 }, [userId, refresh]);
 const savePerformance = useCallback(async (session: string, athlete: string, date: string, metrics: SessionMetric[], notes: string, version = 0) => {
  if (!userId || mutation.current) throw new Error('Opération impossible. Vérifiez les informations et votre connexion.');
  mutation.current = true; setBusy(true); setError(''); revision.current++;
  try {
   const result = await saveSharedPerformance(session, athlete, date, metrics, notes, version);
   if (identity.current !== userId) throw new Error('Opération impossible. Vérifiez les informations et votre connexion.');
   if (identity.current === userId) { revision.current++; setSnapshot(previous => ({ userId, data: { ...(previous.userId === userId ? previous.data : emptySharedData), performances: [result, ...previous.data.performances.filter(item => item.id !== result.id)] } })); }
   return result;
  } catch (reason) { if (identity.current === userId) setError(reason instanceof Error ? reason.message : 'Opération impossible. Vérifiez les informations et votre connexion.'); throw reason; }
  finally { mutation.current = false; if (identity.current === userId) setBusy(false); }
 }, [userId]);
 return <SharedGroupsContext.Provider value={{ data: snapshot.userId === userId ? snapshot.data : emptySharedData, loading, busy, error, userId, email: user?.email ?? '', refresh, operate, savePerformance }}>{children}</SharedGroupsContext.Provider>;
}
