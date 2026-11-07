import { useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { CompResult } from '@/types';
import type { SharedSession } from '@/types/sharedGroups';
import {
  athleteCompetitionFor, athletePlanFor, canonical, competitionSignature, performanceToResults, performanceToSession,
  planSignature, resultsToPerformance,
} from '@/services/cloudSyncMapping';

// Athlete side, in the background:
// 1. sessions and competitions sent by the coach become the athlete's own plan and competitions
//    (Plans, Compétitions, calendar), and disappear when the coach withdraws them;
// 2. what the athlete enters on them (performances, results) is sent to the coach;
// 3. results the coach enters for the athlete come back into the athlete's stats.
export function useAthleteCloudSync() {
  const { user, athletes, trainingPlans, competitions, results, sessionPerformances, addAthlete, addTrainingPlan, updateTrainingPlan, deleteTrainingPlan, addCompetition, updateCompetition, deleteCompetition, addResult, updateResult, addSessionPerformance } = useApp();
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
    addAthlete({ id: uid, name: user.name || 'Moi', email: user.email, events: [], group: 'sprints', pb: {}, status: 'active' });
  }, [active, uid, athletes, user.name, user.email, addAthlete]);

  // 1. Coach's items → my plans and competitions.
  useEffect(() => {
    if (!active) return;
    for (const [groupId] of myGroups) {
      const groupName = shared.data.groups.find(group => group.id === groupId)?.name ?? 'Coach';
      const planId = `shared-plan-${groupId}`;
      const existing = trainingPlans.find(plan => plan.id === planId);
      const next = athletePlanFor(groupId, groupName, rows.filter(row => row.group_id === groupId), uid, existing);
      if (!next) { if (existing && !sessionPerformances.some(item => item.planId === planId)) deleteTrainingPlan(planId); continue; }
      if (!existing) addTrainingPlan(next); else if (planSignature(existing) !== planSignature(next)) updateTrainingPlan(next);
    }
    const competitionRows = rows.filter(row => row.kind === 'competition');
    for (const row of competitionRows) {
      const next = athleteCompetitionFor(row, uid);
      const existing = competitions.find(item => item.id === next.id);
      if (!existing) addCompetition(next); else if (competitionSignature(existing) !== competitionSignature(next)) updateCompetition({ ...existing, ...next, status: existing.status === 'cancelled' ? existing.status : next.status });
    }
    const present = new Set(competitionRows.map(row => `shared-comp-${row.id}`));
    for (const item of competitions) {
      if (item.id.startsWith('shared-comp-') && !present.has(item.id) && !results.some(result => result.competitionId === item.id)) deleteCompetition(item.id);
    }
  }, [active, uid, rows, myGroups, shared.data.groups, trainingPlans, competitions, results, sessionPerformances, addTrainingPlan, updateTrainingPlan, deleteTrainingPlan, addCompetition, updateCompetition, deleteCompetition]);

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
              addSessionPerformance(performanceToSession(performance, `ss-${row.id}`, `shared-plan-${row.group_id}`, uid, user.name));
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
            if (!error) { cache[key] = signature; cacheChanged = true; cloudChanged = true; }
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
