import { useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { CompResult } from '@/types';
import type { SharedSession } from '@/types/sharedGroups';
import {
  athleteCompetitionFor, athletePlanIdFor, athletePlansFor, canonical, competitionSignature, performanceToResults, performanceToSession,
  planSignature, resultsToPerformance,
} from '@/services/cloudSyncMapping';
import { isRecent, notifyResult } from '@/services/pushService';
import { localGroupFor } from '@/services/trainingGroups';

// Athlete side, in the background:
// 1. sessions and competitions sent by the coach become the athlete's own plan and competitions
//    (Plans, Compétitions, calendar), and disappear when the coach withdraws them;
// 2. what the athlete enters on them (performances, results) is sent to the coach;
// 3. results the coach enters for the athlete come back into the athlete's stats.
export function useAthleteCloudSync() {
  const { user, athletes, trainingPlans, competitions, results, sessionPerformances, addAthlete, addTrainingPlan, updateTrainingPlan, deleteTrainingPlan, addCompetition, updateCompetition, deleteCompetition, addResult, updateResult, addSessionPerformance, mergeCompetitions } = useApp();
  const shared = useSharedGroups();
  const uid = shared.userId;
  const running = useRef(false);

  // My athlete record in each group where I am an athlete.
  const mine = useMemo(() => shared.data.athletes.filter(item => item.user_id === uid), [shared.data.athletes, uid]);
  const myShared = useMemo(() => new Set(mine.map(item => item.id)), [mine]);
  const myGroups = useMemo(() => new Map(mine.map(item => [item.group_id, item.id])), [mine]);
  const active = !!uid && user.userType === 'athlete' && myGroups.size > 0;
  const rows = useMemo(() => shared.data.sessions.filter(row => myGroups.has(row.group_id) && (!row.athlete_id || myShared.has(row.athlete_id))), [shared.data.sessions, myGroups, myShared]);

  // The athlete's own record (stats are attached to it).
  useEffect(() => {
    if (!active || athletes.some(item => item.id === uid)) return;
    const discipline = shared.data.groups.find(group => myGroups.has(group.id) && group.discipline && group.discipline !== 'all')?.discipline ?? 'all';
    addAthlete({ id: uid, name: user.name || 'Moi', email: user.email, events: [], group: localGroupFor(discipline), pb: {}, status: 'active' });
  }, [active, uid, athletes, user.name, user.email, addAthlete, shared.data.groups, myGroups]);

  // 1. Coach's items → my plans and competitions.
  useEffect(() => {
    if (!active) return;
    for (const [groupId] of myGroups) {
      const groupName = shared.data.groups.find(group => group.id === groupId)?.name ?? 'Coach';
      const nextPlans = athletePlansFor(groupId, groupName, rows.filter(row => row.group_id === groupId), uid);
      const planOfSession = new Map(nextPlans.flatMap(plan => plan.sessions.map(session => [session.id, plan.id] as const)));
      for (const next of nextPlans) {
        const existing = trainingPlans.find(plan => plan.id === next.id);
        if (!existing) addTrainingPlan(next); else if (planSignature(existing) !== planSignature(next)) updateTrainingPlan(next);
      }
      // Entries already made follow their session into its new plan; plans no longer sent disappear.
      for (const performance of sessionPerformances) {
        const target = planOfSession.get(performance.sessionId);
        if (target && performance.planId !== target && performance.planId.startsWith(`shared-plan-${groupId}`)) addSessionPerformance({ ...performance, planId: target });
      }
      const keep = new Set(nextPlans.map(plan => plan.id));
      for (const plan of trainingPlans) {
        if (!plan.id.startsWith(`shared-plan-${groupId}`) || keep.has(plan.id)) continue;
        const orphan = sessionPerformances.some(item => item.planId === plan.id && !planOfSession.has(item.sessionId));
        if (!orphan) deleteTrainingPlan(plan.id);
      }
    }
    // Same competition received several times (older duplicates): shown once, the copy with a result first.
    const byKey = new Map<string, SharedSession>();
    for (const row of rows.filter(item => item.kind === 'competition').sort((x, y) => Number(shared.data.performances.some(p => p.session_id === y.id)) - Number(shared.data.performances.some(p => p.session_id === x.id)) || x.id.localeCompare(y.id))) {
      const key = `${row.title.trim().toLowerCase()}|${row.session_date}`;
      if (!byKey.has(key)) byKey.set(key, row);
    }
    const competitionRows = [...byKey.values()];
    for (const row of competitionRows) {
      const next = athleteCompetitionFor(row, uid);
      const existing = competitions.find(item => item.id === next.id);
      if (!existing) addCompetition(next); else if (competitionSignature(existing) !== competitionSignature(next)) updateCompetition({ ...existing, ...next, status: existing.status === 'cancelled' ? existing.status : next.status });
    }
    const present = new Set(competitionRows.map(row => `shared-comp-${row.id}`));
    const keyOf = (name: string, date: string) => `${name.trim().toLowerCase()}|${date.slice(0, 10)}`;
    const presentByKey = new Map(competitionRows.map(row => [keyOf(row.title, row.session_date), `shared-comp-${row.id}`]));
    for (const item of competitions) {
      if (present.has(item.id)) continue;
      // Older copy of a competition received from the coach, or the same one entered here: merged into it.
      const keep = presentByKey.get(keyOf(item.name, item.date));
      if (keep && competitions.some(other => other.id === keep)) { mergeCompetitions(keep, [item.id]); continue; }
      if (item.id.startsWith('shared-comp-') && !results.some(result => result.competitionId === item.id)) deleteCompetition(item.id);
    }
  }, [active, uid, rows, myGroups, shared.data.groups, shared.data.performances, trainingPlans, competitions, results, sessionPerformances, addTrainingPlan, updateTrainingPlan, deleteTrainingPlan, addCompetition, updateCompetition, deleteCompetition, mergeCompetitions, addSessionPerformance]);

  // 2-3. Performances and results, both ways.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      if (running.current) return;
      running.current = true;
      void (async () => {
        const client = getSupabaseClient();
        const cacheKey = `@appletics_sync_cache:${uid}`;
        const cache: Record<string, string> = JSON.parse((await AsyncStorage.getItem(cacheKey).catch(() => null)) || '{}');
        let cacheChanged = false; let cloudChanged = false;
        const rowById = new Map<string, SharedSession>(rows.map(row => [row.id, row]));
        try {
          // 3. Cloud → my stats (including results entered by my coach).
          for (const performance of shared.data.performances) {
            if (!myShared.has(performance.athlete_id)) continue;
            const row = rowById.get(performance.session_id); if (!row) continue;
            const signature = canonical(performance.performed_on, performance.metrics, performance.notes ?? '');
            const key = `perf:${row.id}:${performance.athlete_id}`;
            if (cache[key] === signature) continue;
            if (row.kind === 'competition') {
              const competitionId = `shared-comp-${row.id}`;
              if (!competitions.some(item => item.id === competitionId)) continue; // created on the next pass
              for (const result of performanceToResults(performance, competitionId, uid)) {
                if (results.some(item => item.id === result.id)) updateResult(result); else addResult(result);
              }
            } else {
              addSessionPerformance(performanceToSession(performance, `ss-${row.id}`, athletePlanIdFor(row), uid, user.name));
            }
            cache[key] = signature; cacheChanged = true;
          }
          // 2. My entries → my coach.
          const versionOf = (sessionId: string, sharedAthlete: string) => shared.data.performances.find(item => item.session_id === sessionId && item.athlete_id === sharedAthlete)?.version ?? 0;
          const save = async (row: SharedSession, date: string, metrics: { label: string; value: string; unit: string }[], notes: string) => {
            const sharedAthlete = myGroups.get(row.group_id); if (!sharedAthlete || !metrics.length) return;
            const signature = canonical(date, metrics, notes);
            const key = `perf:${row.id}:${sharedAthlete}`;
            if (cache[key] === signature) return;
            const { error } = await client.rpc('shared_save_performance', { p_session: row.id, p_athlete: sharedAthlete, p_date: date, p_metrics: metrics.slice(0, 30), p_notes: notes, p_version: versionOf(row.id, sharedAthlete) });
            if (!error) { cache[key] = signature; cacheChanged = true; cloudChanged = true; if (isRecent(date)) notifyResult(row.id, sharedAthlete); }
          };
          for (const performance of sessionPerformances) {
            if (!performance.sessionId.startsWith('ss-') || performance.athleteId !== uid) continue;
            const row = rowById.get(performance.sessionId.slice(3));
            if (row) await save(row, performance.date, performance.metrics, performance.notes ?? '');
          }
          const byCompetition = new Map<string, CompResult[]>();
          for (const result of results) {
            if (!result.competitionId.startsWith('shared-comp-') || result.athleteId !== uid) continue;
            byCompetition.set(result.competitionId, [...(byCompetition.get(result.competitionId) ?? []), result]);
          }
          for (const [competitionId, list] of byCompetition) {
            const row = rowById.get(competitionId.slice('shared-comp-'.length)); if (!row) continue;
            const { metrics, notes } = resultsToPerformance(list);
            await save(row, row.session_date, metrics, notes);
          }
        } finally {
          if (cacheChanged) await AsyncStorage.setItem(cacheKey, JSON.stringify(cache)).catch(() => {});
          if (cloudChanged) void shared.refresh();
          running.current = false;
        }
      })();
    }, 2000);
    return () => clearTimeout(timer);
  }, [active, uid, rows, myShared, myGroups, competitions, results, sessionPerformances, shared.data.performances, shared.refresh, user.name, addResult, updateResult, addSessionPerformance]);
}
