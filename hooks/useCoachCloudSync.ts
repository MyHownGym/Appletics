import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { Athlete, CompResult } from '@/types';
import {
  canonical, coachDesiredItems, hash, parseSource, performanceToResults, performanceToSession,
  resultsToPerformance, staleRows, scheduledOn,
} from '@/services/cloudSyncMapping';
import { isRecent, notifyNewItems, notifyResult } from '@/services/pushService';
import { asSync, consumeUserEdit, resultEditKey, sessionEditKey } from '@/services/userEdits';
import { localGroupFor } from '@/services/trainingGroups';

// Coach side, in the background (the coach's device data stays the source for what the coach creates):
// 1. athletes of the coach's shared groups appear in the coach's athlete list;
// 2. plans (next 14 days) and competitions assigned to them are sent to each athlete, and withdrawn when removed;
// 3. what athletes enter (session performances, competition results) comes back into the coach's stats;
// 4. results the coach enters for them are sent to the athletes.
export function useCoachCloudSync() {
  const app = useApp();
  const { user, athletes, trainingPlans, competitions, results, sessionPerformances, addAthlete, addResult, updateResult, addSessionPerformance, mergeAthletes, updateAthlete, addCompetition } = app;
  const shared = useSharedGroups();
  const uid = shared.userId;
  const isCoach = !!uid && user.userType !== 'athlete';
  const running = useRef(false);

  const coachGroups = useMemo(() => new Set(shared.data.members.filter(item => item.user_id === uid && item.role === 'coach').map(item => item.group_id)), [shared.data.members, uid]);
  const groupNames = useMemo(() => new Map(shared.data.groups.map(group => [group.id, group.name])), [shared.data.groups]);
  const groupDisciplines = useMemo(() => new Map(shared.data.groups.map(group => [group.id, group.discipline || 'all'])), [shared.data.groups]);
  const groupAthletes = useMemo(() => shared.data.athletes.filter(item => coachGroups.has(item.group_id)), [shared.data.athletes, coachGroups]);

  // Remembered links (shared athlete → local athlete), kept on the device.
  const [storedLinks, setStoredLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!uid) return;
    void AsyncStorage.getItem(`@appletics_athlete_links:${uid}`).then(raw => setStoredLinks(JSON.parse(raw || '{}'))).catch(() => {});
  }, [uid]);

  // local athlete id → shared athlete id
  const links = useMemo(() => {
    const map = new Map<string, string>();
    // Same person in several groups: the record of a group with a discipline wins (e.g. « Sprint » over « Athlètes de … »).
    const ordered = [...groupAthletes].sort((a, b) => Number((groupDisciplines.get(a.group_id) ?? 'all') !== 'all') - Number((groupDisciplines.get(b.group_id) ?? 'all') !== 'all'));
    for (const item of ordered) {
      if (item.source_id?.startsWith(`${uid}:`)) { const local = item.source_id.slice(uid.length + 1); if (athletes.some(a => a.id === local)) map.set(local, item.id); }
      if (athletes.some(local => local.id === `shared-${item.id}`)) map.set(`shared-${item.id}`, item.id);
      const remembered = storedLinks[item.id];
      if (remembered && athletes.some(local => local.id === remembered)) map.set(remembered, item.id);
    }
    return map;
  }, [groupAthletes, athletes, uid, storedLinks, groupDisciplines]);
  // Athletes' profile photos (set in their own app) shown on the coach's athlete records.
  useEffect(() => {
    if (!isCoach) return;
    for (const [localId, sharedId] of links) {
      const record = groupAthletes.find(item => item.id === sharedId);
      if (!record?.user_id) continue;
      const photo = shared.data.members.find(item => item.user_id === record.user_id && item.avatar)?.avatar ?? undefined;
      const local = athletes.find(item => item.id === localId);
      if (local && photo && local.avatar !== photo) updateAthlete({ ...local, avatar: photo });
    }
  }, [isCoach, links, groupAthletes, shared.data.members, athletes, updateAthlete]);

  // shared athlete id → local athlete id (every group record, including a second group of the same person)
  const localOf = useMemo(() => {
    const map = new Map([...links].map(([local, sharedId]) => [sharedId, local]));
    for (const item of groupAthletes) {
      if (map.has(item.id)) continue;
      const sourceLocal = item.source_id?.startsWith(`${uid}:`) ? item.source_id.slice(uid.length + 1) : '';
      const local = [`shared-${item.id}`, sourceLocal, storedLinks[item.id]].find(id => id && athletes.some(a => a.id === id));
      if (local) map.set(item.id, local);
    }
    return map;
  }, [links, groupAthletes, athletes, uid, storedLinks]);

  // 1. Each group athlete ↔ exactly one athlete in the coach's list: linked by invitation, e-mail or name,
  //    added once if missing, and duplicates (same person recorded twice) merged with all their data.
  useEffect(() => {
    if (!isCoach || !groupAthletes.length) return;
    let cancelled = false;
    void (async () => {
      const knownKey = `@appletics_synced_athletes:${uid}`, linkKey = `@appletics_athlete_links:${uid}`;
      const known = new Set<string>(JSON.parse((await AsyncStorage.getItem(knownKey).catch(() => null)) || '[]'));
      const stored: Record<string, string> = JSON.parse((await AsyncStorage.getItem(linkKey).catch(() => null)) || '{}');
      if (cancelled) return;
      const norm = (text?: string) => (text ?? '').trim().toLowerCase();
      const referenced = (id: string) => results.filter(item => item.athleteId === id).length + trainingPlans.filter(plan => plan.athleteIds.includes(id)).length + competitions.filter(item => item.athleteIds.includes(id)).length;
      const taken = new Set<string>();
      const wanted = new Map<string, string>(); // local athlete → discipline of its (first) training group
      let changed = false;
      for (const item of groupAthletes) {
        const email = norm(shared.data.invitations.find(invite => invite.athlete_id === item.id)?.email);
        const sourceLocal = item.source_id?.startsWith(`${uid}:`) ? item.source_id.slice(uid.length + 1) : '';
        const matches = athletes.filter(local => !taken.has(`${item.group_id}:${local.id}`) && (
          local.id === `shared-${item.id}` || local.id === sourceLocal || local.id === stored[item.id]
          || (email && norm(local.email) === email) || norm(local.name) === norm(item.name)));
        if (!matches.length) {
          if (!known.has(item.id)) {
            const athlete: Athlete = { id: `shared-${item.id}`, name: item.name, events: [], group: localGroupFor(groupDisciplines.get(item.group_id) ?? 'all'), pb: {}, status: 'active', ...(email ? { email } : {}), notes: `Groupe : ${groupNames.get(item.group_id) ?? ''}` };
            addAthlete(athlete); stored[item.id] = athlete.id; taken.add(`${item.group_id}:${athlete.id}`); known.add(item.id); changed = true;
          }
          continue;
        }
        const keeper = [...matches].sort((a, b) => Number(a.id.startsWith('shared-')) - Number(b.id.startsWith('shared-')) || referenced(b.id) - referenced(a.id))[0];
        if (matches.length > 1) mergeAthletes(keeper.id, matches.filter(local => local.id !== keeper.id).map(local => local.id));
        matches.forEach(local => taken.add(`${item.group_id}:${local.id}`));
        // The training group decides the athlete's discipline in the coach's list (filters in Plans, Athlètes…).
        const discipline = groupDisciplines.get(item.group_id) ?? 'all';
        if (discipline !== 'all' && !wanted.has(keeper.id)) wanted.set(keeper.id, discipline);
        if (stored[item.id] !== keeper.id || !known.has(item.id)) { stored[item.id] = keeper.id; known.add(item.id); changed = true; }
      }
      if (!cancelled) for (const [localId, discipline] of wanted) {
        const local = athletes.find(item => item.id === localId);
        if (local && local.group !== discipline) updateAthlete({ ...local, group: discipline });
      }
      if (changed && !cancelled) {
        await AsyncStorage.multiSet([[knownKey, JSON.stringify([...known])], [linkKey, JSON.stringify(stored)]]).catch(() => {});
        setStoredLinks({ ...stored });
      }
    })();
    return () => { cancelled = true; };
  }, [isCoach, uid, groupAthletes, shared.data.invitations, athletes, results, trainingPlans, competitions, addAthlete, mergeAthletes, updateAthlete, groupNames, groupDisciplines]);

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
          // Same person recorded twice on the coach's list (e.g. once per group): a plan given to the unlinked copy
          // still reaches the athlete through the linked one (same e-mail, else same name).
          const norm = (text?: string) => (text ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();
          const publishLinks = new Map(links);
          for (const local of athletes) {
            if (publishLinks.has(local.id)) continue;
            const twin = athletes.find(other => other.id !== local.id && links.has(other.id)
              && ((!!local.email && norm(other.email) === norm(local.email)) || (!!norm(local.name) && norm(other.name) === norm(local.name))));
            if (twin) publishLinks.set(local.id, links.get(twin.id)!);
          }
          const desired = coachDesiredItems(trainingPlans, competitions, publishLinks, new Map(athletes.map(item => [item.id, item.name])));
          const today = new Date().toISOString().slice(0, 10);
          const fresh = new Map<string, { sessions: number; competitions: number; firstTitle: string }>();
          for (const item of desired) {
            const signature = hash(JSON.stringify([item.kind, item.title, item.date, item.details, item.meta]));
            // Already sent with this content: never sent again (no loop even if the cloud copy is slow to appear).
            if (cache[`pub:${item.source}`] === signature) continue;
            const { error } = await client.rpc('shared_publish_athlete_item', { p_athlete: item.sharedAthlete, p_kind: item.kind, p_title: item.title, p_date: item.date, p_details: item.details, p_meta: item.meta, p_source: item.source });
            if (error) { if (error.code === 'PGRST202') return; continue; } // database not updated yet: retry later
            const isNew = !rowBySource.has(item.source) && !cache[`pub:${item.source}`];
            if (isNew && item.date >= today) {
              const counter = fresh.get(item.sharedAthlete) ?? { sessions: 0, competitions: 0, firstTitle: item.title };
              if (item.kind === 'competition') counter.competitions++; else counter.sessions++;
              fresh.set(item.sharedAthlete, counter);
            }
            cache[`pub:${item.source}`] = signature; cacheChanged = true; cloudChanged = true;
          }
          for (const [sharedAthlete, counter] of fresh) notifyNewItems(sharedAthlete, counter.sessions, counter.competitions, counter.firstTitle);
          // 2b. Withdraw what is no longer assigned (upcoming only, never anything with a result).
          const linkedIds = new Set(links.values());
          const linkedUsers = new Set(groupAthletes.filter(item => linkedIds.has(item.id) && item.user_id).map(item => item.user_id));
          const superseded = new Set(groupAthletes.filter(item => !linkedIds.has(item.id) && item.user_id && linkedUsers.has(item.user_id)).map(item => item.id));
          const logged = new Set(shared.data.performances.map(item => item.session_id));
          const stale = staleRows(rows, new Set(desired.map(item => item.source)), linkedIds, undefined, uid, superseded,
            row => !logged.has(row.id) && !scheduledOn(trainingPlans, row.source_key as string));
          if (stale.length) { const { error } = await client.rpc('shared_delete_published', { p_ids: stale }); if (!error) cloudChanged = true; }

          // 3. Athletes' entries → coach's stats.
          const rowById = new Map(rows.map(row => [row.id, row]));
          const created = new Set<string>();
          for (const performance of shared.data.performances) {
            const row = rowById.get(performance.session_id); const source = parseSource(row?.source_key);
            const localId = localOf.get(performance.athlete_id);
            if (!row || !source || !localId) continue;
            const signature = canonical(performance.performed_on, performance.metrics, performance.notes ?? '');
            const key = `perf:${row.id}:${performance.athlete_id}`;
            // Already received — unless the results are missing here (lost copy on this device): received again.
            const missingHere = source.kind === 'comp' && performance.metrics.length > 0 && !results.some(item => item.competitionId === source.competitionId && item.athleteId === localId);
            if (cache[key] === signature && !missingHere) continue;
            const athlete = athletes.find(item => item.id === localId);
            if (source.kind === 'plan') {
              asSync(() => addSessionPerformance(performanceToSession(performance, source.sessionId, source.planId, localId, athlete?.name ?? '')));
            } else {
              // The coach's copy of the competition is missing on this device (other phone, browser…): rebuilt from
              // what was sent, so the athlete's results always reach the coach's stats.
              if (!competitions.some(item => item.id === source.competitionId) && !created.has(source.competitionId)) {
                const meta = row.meta ?? {};
                addCompetition({
                  id: source.competitionId, name: row.title, type: String(meta.type ?? 'outdoor'), date: row.session_date, venue: String(meta.venue ?? ''),
                  ...(meta.location ? { location: String(meta.location) } : {}), ...(meta.endDate ? { endDate: String(meta.endDate) } : {}),
                  status: row.session_date < new Date().toISOString().slice(0, 10) ? 'completed' : 'upcoming', events: Array.isArray(meta.events) ? (meta.events as string[]) : [],
                  athleteIds: [...new Set(shared.data.sessions.filter(item => parseSource(item.source_key)?.kind === 'comp' && (parseSource(item.source_key) as { competitionId: string }).competitionId === source.competitionId).map(item => localOf.get(item.athlete_id ?? '')).filter((id): id is string => !!id))],
                });
                created.add(source.competitionId);
              }
              for (const result of performanceToResults(performance, source.competitionId, localId)) {
                asSync(() => { if (results.some(item => item.id === result.id)) updateResult(result); else addResult(result); });
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
            // Sent only for a real change: an entry made here, or values the cloud does not have yet
            // (never just a different formatting of what the athlete already sent).
            const edited = consumeUserEdit(resultEditKey(competitionId, localId));
            const cloudPerf = shared.data.performances.find(item => item.session_id === row.id && item.athlete_id === sharedAthlete);
            const values = (list2: { label: string; value: string }[]) => JSON.stringify(list2.map(item => [item.label.trim(), item.value.trim()]).sort());
            if (!edited && cloudPerf && values(cloudPerf.metrics) === values(metrics)) { cache[cacheId] = signature; cacheChanged = true; continue; }
            const { error } = await client.rpc('shared_save_performance', { p_session: row.id, p_athlete: sharedAthlete, p_date: row.session_date, p_metrics: metrics, p_notes: notes, p_version: versionOf(row.id, sharedAthlete) });
            // Notification only for what the coach just entered on this device.
            if (!error) { cache[cacheId] = signature; cacheChanged = true; cloudChanged = true; if (edited && isRecent(row.session_date)) notifyResult(row.id, sharedAthlete); }
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
            if (!error) { cache[cacheId] = signature; cacheChanged = true; cloudChanged = true; if (consumeUserEdit(sessionEditKey(performance.sessionId, performance.athleteId)) && isRecent(performance.date, 3)) notifyResult(row.id, sharedAthlete); }
          }
        } finally {
          if (cacheChanged) await AsyncStorage.setItem(cacheKey, JSON.stringify(cache)).catch(() => {});
          if (cloudChanged) void shared.refresh();
          running.current = false;
        }
      })();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isCoach, uid, links, localOf, groupAthletes, trainingPlans, competitions, results, sessionPerformances, athletes, shared.data.sessions, shared.data.performances, shared.refresh, addResult, updateResult, addSessionPerformance, addCompetition]);
}
