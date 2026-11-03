import { getSupabaseClient } from '@/template';
import type { SharedData, SharedPerformance } from '@/types/sharedGroups';
import type { SessionMetric } from '@/types';
export async function loadSharedData(): Promise<SharedData> {
  const tables = ['shared_groups','shared_group_members','shared_athletes','shared_group_invitations','shared_sessions','shared_performances'] as const;
  const results = await Promise.all(tables.map(async table => {
    const records: Record<string, unknown>[] = [];
    for (let page = 0; ; page++) {
      let query = getSupabaseClient().from(table).select('*');
      query = table === 'shared_group_members' ? query.order('group_id').order('user_id') : query.order('id');
      const { data, error } = await query.range(page * 500, page * 500 + 499);
      if (error) throw new Error('Impossible de synchroniser les groupes. Vérifiez votre connexion.');
      records.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) return records;
    }
  }));
  return { groups: results[0], members: results[1], athletes: results[2], invitations: results[3], sessions: results[4], performances: results[5] } as unknown as SharedData;
}
export async function sharedOperation<T = unknown>(name: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().rpc(name, parameters);
  if (error) {
    if (error.code === '23505' || error.message.includes('Performance changed')) throw new Error('Cette donnée a changé. Actualisez avant de modifier.');
    if (error.message.includes('Access denied')) throw new Error('Vous ne disposez pas de cet accès.');
    if (error.message.includes('Invitation expired')) throw new Error('Invitation expirée ou indisponible.');
    throw new Error('Opération impossible. Vérifiez les informations et votre connexion.');
  }
  return data as T;
}
export function saveSharedPerformance(sessionId: string, athleteId: string, date: string, metrics: SessionMetric[], notes: string, version = 0) {
  const clean = metrics.map(metric => ({ label: metric.label.trim(), value: metric.value.trim(), unit: metric.unit.trim() }));
  if (!clean.length || clean.length > 30 || clean.some(metric => !metric.label || !metric.value || !metric.unit)) throw new Error('Complétez chaque mesure.');
  return sharedOperation<SharedPerformance>('shared_save_performance', { p_session: sessionId, p_athlete: athleteId, p_date: date, p_metrics: clean, p_notes: notes.trim(), p_version: version });
}
