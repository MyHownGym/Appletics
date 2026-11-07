import { useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { Athlete, CompResult } from '@/types';
import {
  canonical, coachDesiredItems, hash, parseSource, performanceToResults, performanceToSession,
  resultsToPerformance, staleRows,
} from '@/services/cloudSyncMapping';

// Coach side, in the background (the coach's device data stays the source for what the coach creates):
// 1. athletes of the coach's shared groups appear in the coach's athlete list;
// 2. plans (next 14 days) and competitions assigned to them are sent to each athlete, and withdrawn when removed;
// 3. what athletes enter (session performances, competition results) comes back into the coach's stats;
// 4. results the coach enters for them are sent to the athletes.
export function useCoachCloudSync() {
  const app = useApp();
  const { user, athletes, trainingPlans, competitions, results, sessionPerformances, addAthlete, addResult, updateResult, addSessionPerformance } = app;
  const shared = useSharedGroups();
  const uid = shared.userId;
  const isCoach = !!uid && user.userType !== 'athlete';
  const running = useRef(false);

  const coachGroups = useMemo(() => new Set(shared.data.members.filter(item => item.user_id === uid && item.role === 'coach').map(item => item.group_id)), [shared.data.members, uid]);
  const groupNames = useMemo(() => new Map(shared.data.groups.map(group => [group.id, group.name])), [shared.data.groups]);
  const groupAthletes = useMemo(() => shared.data.athletes.filter(item => coachGroups.has(item.group_id)), [shared.data.athletes, coachGroups]);

  // local athlete id → shared athlete id (explicit link from an invitation, or created by this sync)
  const links = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of groupAthletes) {
      if (item.source_id?.startsWith(`${uid}:`)) map.set(item.source_id.slice(uid.length + 1), item.id);
      if (athletes.some(local => local.id === `shared-${item.id}`)) map.set(`shared-${item.id}`, item.id);
    }
    return map;
  }, [groupAthletes, athletes, uid]);
  const localOf = useMemo(() => new Map([...links].map(([local, sharedId]) => [sharedId, local])), [links]);

  // 1. Missing athletes → added once (an athlete the coach deletes does not come back).
  useEffect(() => {
    if (!isCoach || !groupAthletes.length) return;
    let cancelled = false;
    void (async () => {
      const key = `@appletics_synced_athletes:${uid}`;
      const known = new Set<string>(JSON.parse((await AsyncStorage.getItem(key).catch(() => null)) || '[]'));
      let changed = false;
      for (const item of groupAthletes) {
        if (cancelled || known.has(item.id)) continue;
        const linkedLocal = item.source_id?.startsWith(`${uid}:`) ? item.source_id.slice(uid.length + 1) : '';
        if (!athletes.some(local => local.id === `shared-${item.id}` || (linkedLocal && local.id === linkedLocal))) {
          const email = shared.data.invitations.find(invite => invite.athlete_id === item.id)?.email;
          const athlete: Athlete = { id: `shared-${item.id}`, name: item.name, events: [], group: 'sprints', pb: {}, status: 'active', ...(email ? { email } : {}), notes: `Groupe partagé : ${groupNames.get(item.group_id) ?? ''}` };
          addAthlete(athlete);
        }
        known.add(item.id); changed = true;
      }
      if (changed && !cancelled) await AsyncStorage.setItem(key, JSON.stringify([...known])).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [isCoach, uid, groupAthletes, shared.data.invitations, athletes, addAthlete, groupNames]);

  // 2-4. Two-way sync of plans, competitions and results, a few seconds after any change.
  useEffect(() => {
    if (!isCoach || !links.size) return;
    const timer = setTimeout(() => {
      if (running.current) return;
      running.current = true;
      void (async () => {
        const client = getSupabaseClient();
        const cacheKey = `@appletics_sync_cache:${uid}`;
        const cache: Record<string, string> = JSON.parse((await AsyncStorage.getItem(cacheKey).catch(() => null)) || '{}');
        let cloudChanged = false; let cacheChanged = false;
        const rows = shared.data.sessions;
        const rowBySource = new Map(rows.filter(row => row.source_key).map(row => [row.source_key as string, row]));
        try {
          // 2a. Send plans and competitions (only what changed).
          const desired = coachDesiredItems(trainingPlans, competitions, links);
          for (const item of desired) {
            const signature = hash(JSON.stringify([item.kind, item.title, item.date, item.details, item.meta]));
            // Already sent with this content: never sent again (no loop even if the cloud copy is slow to appear).
            if (cache[`pub:${item.source}`] === signature) continue;
            const { error } = await client.rpc('shared_publish_athlete_item', { p_athlete: item.sharedAthlete, p_kind: item.kind, p_title: item.title, p_date: item.date, p_details: item.details, p_meta: item.meta, p_source: item.source });
            if (error) { if (error.code === 'PGRST202') return; continue; } // database not updated yet: retry later
            cache[`pub:${item.source}`] = signature; cacheChanged = true; cloudChanged = true;
          }
          // 2b. Withdraw what is no longer assigned (upcoming only, never anything with a result).
          const stale = staleRows(rows, new Set(desired.map(item => item.source)), new Set(links.values()));
          if (stale.length) { const { error } = await client.rpc('shared_delete_published', { p_ids: stale }); if (!error) cloudChanged = true; }

          // 3. Athletes' entries → coach's stats.
          const rowById = new Map(rows.map(row => [row.id, row]));
          for (const performance of shared.data.performances) {
            const row = rowById.get(performance.session_id); const source = parseSource(row?.source_key);
            const localId = localOf.get(performance.athlete_id);
            if (!row || !source || !localId) continue;
            const signature = canonical(performance.performed_on, performance.metrics, performance.notes ?? '');
            const key = `perf:${row.id}:${performance.athlete_id}`;
            if (cache[key] === signature) continue;
            const athlete = athletes.find(item => item.id === localId);
            if (source.kind === 'plan') {
              addSessionPerformance(performanceToSession(performance, source.sessionId, source.planId, localId, athlete?.name ?? ''));
            } else if (competitions.some(item => item.id === source.competitionId)) {
              for (const result of performanceToResults(performance, source.competitionId, localId)) {
                if (results.some(item => item.id === result.id)) updateResult(result); else addResult(result);
              }
            }
            cache[key] = signature; cacheChanged = true;
          }

          // 4. Results entered by the coach → athletes.
          const versionOf = (sessionId: string, sharedAthlete: string) => shared.data.performances.find(item => item.session_id === sessionId && item.athlete_id === sharedAthlete)?.version ?? 0;
          const byCompetition = new Map<string, CompResult[]>();
          for (const result of results) {
            if (!links.has(result.athleteId)) continue;
            const key = `${result.competitionId}|${result.athleteId}`;
            byCompetition.set(key, [...(byCompetition.get(key) ?? []), result]);
          }
          for (const [key, list] of byCompetition) {
            const [competitionId, localId] = key.split('|');
            const sharedAthlete = links.get(localId)!;
            const row = rowBySource.get(`comp:${competitionId}:${sharedAthlete}`);
            if (!row) continue;
            const { metrics, notes } = resultsToPerformance(list);
            if (!metrics.length) continue;
            const signature = canonical(row.session_date, metrics, notes);
            const cacheId = `perf:${row.id}:${sharedAthlete}`;
            if (cache[cacheId] === signature) continue;
            const { error } = await client.rpc('shared_save_performance', { p_session: row.id, p_athlete: sharedAthlete, p_date: row.session_date, p_metrics: metrics, p_notes: notes, p_version: versionOf(row.id, sharedAthlete) });
            if (!error) { cache[cacheId] = signature; cacheChanged = true; cloudChanged = true; }
          }
          for (const performance of sessionPerformances) {
            const sharedAthlete = links.get(performance.athleteId);
            if (!sharedAthlete || !performance.metrics?.length) continue;
            const candidates = rows.filter(row => row.athlete_id === sharedAthlete && row.source_key?.startsWith(`plan:${performance.planId}:${performance.sessionId}:`)).sort((a, b) => a.session_date.localeCompare(b.session_date));
            const row = candidates.find(item => item.session_date === performance.date) ?? [...candidates].reverse().find(item => item.session_date <= performance.date) ?? candidates[0];
            if (!row) continue;
            const signature = canonical(performance.date, performance.metrics, performance.notes ?? '');
            const cacheId = `perf:${row.id}:${sharedAthlete}`;
            if (cache[cacheId] === signature) continue;
            const { error } = await client.rpc('shared_save_performance', { p_session: row.id, p_athlete: sharedAthlete, p_date: performance.date, p_metrics: performance.metrics.slice(0, 30), p_notes: performance.notes ?? '', p_version: versionOf(row.id, sharedAthlete) });
            if (!error) { cache[cacheId] = signature; cacheChanged = true; cloudChanged = true; }
          }
        } finally {
          if (cacheChanged) await AsyncStorage.setItem(cacheKey, JSON.stringify(cache)).catch(() => {});
          if (cloudChanged) void shared.refresh();
          running.current = false;
        }
      })();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isCoach, uid, links, localOf, trainingPlans, competitions, results, sessionPerformances, athletes, shared.data.sessions, shared.data.performances, shared.refresh, addResult, updateResult, addSessionPerformance]);
}
