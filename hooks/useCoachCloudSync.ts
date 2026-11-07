import { useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { Athlete, TrainingPlan, TrainingSession } from '@/types';

// Coach side, in the background:
// 1. every athlete of the coach's shared groups also exists in the coach's athlete list (plans can be assigned);
// 2. sessions of plans assigned to those athletes are sent to them for the next 14 days (visible to them only).
const WINDOW_DAYS = 14;
const WEEKDAYS = [['Mon', 'Lun'], ['Tue', 'Mar'], ['Wed', 'Mer'], ['Thu', 'Jeu'], ['Fri', 'Ven'], ['Sat', 'Sam'], ['Sun', 'Dim']];
const INTENSITY: Record<TrainingSession['intensity'], string> = { easy: 'Facile', moderate: 'Modérée', hard: 'Difficile', race: 'Compétition', rest: 'Repos' };

const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const hash = (text: string) => { let value = 0; for (let index = 0; index < text.length; index++) value = (value * 31 + text.charCodeAt(index)) | 0; return String(value); };

// Dates of a session within [today, today + 14 days] and inside the plan's period.
export function upcomingSessionDates(plan: TrainingPlan, session: TrainingSession, today = new Date()): string[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dates: string[] = [];
  for (let offset = 0; offset < WINDOW_DAYS; offset++) {
    const day = new Date(start); day.setDate(start.getDate() + offset);
    const key = isoDay(day);
    if (plan.startDate && key < plan.startDate.slice(0, 10)) continue;
    if (plan.endDate && key > plan.endDate.slice(0, 10)) continue;
    if (session.sessionDate) { if (session.sessionDate === key) dates.push(key); continue; }
    if (WEEKDAYS[(day.getDay() + 6) % 7].includes(session.day)) dates.push(key);
  }
  return dates;
}

export function useCoachCloudSync() {
  const { user, athletes, trainingPlans, addAthlete } = useApp();
  const shared = useSharedGroups();
  const uid = shared.userId;
  const coachGroups = useMemo(() => new Set(shared.data.members.filter(item => item.user_id === uid && item.role === 'coach').map(item => item.group_id)), [shared.data.members, uid]);
  const groupNames = useMemo(() => new Map(shared.data.groups.map(group => [group.id, group.name])), [shared.data.groups]);
  const running = useRef(false);

  // Shared athlete id for each local athlete of the coach (explicit link, or created by this sync).
  const links = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of shared.data.athletes) {
      if (!coachGroups.has(item.group_id)) continue;
      const prefix = `${uid}:`;
      if (item.source_id?.startsWith(prefix)) map.set(item.source_id.slice(prefix.length), item.id);
      map.set(`shared-${item.id}`, item.id);
    }
    return map;
  }, [shared.data.athletes, coachGroups, uid]);

  // 1. Missing athletes → added once to the coach's list (a coach who deletes one does not get it back).
  useEffect(() => {
    if (!uid || user.userType === 'athlete' || !coachGroups.size) return;
    let cancelled = false;
    void (async () => {
      const key = `@appletics_synced_athletes:${uid}`;
      const known = new Set<string>(JSON.parse((await AsyncStorage.getItem(key).catch(() => null)) || '[]'));
      let changed = false;
      for (const item of shared.data.athletes) {
        if (cancelled || !coachGroups.has(item.group_id) || known.has(item.id)) continue;
        const linkedLocal = item.source_id?.startsWith(`${uid}:`) ? item.source_id.slice(uid.length + 1) : '';
        const present = athletes.some(local => local.id === `shared-${item.id}` || (linkedLocal && local.id === linkedLocal));
        if (!present) {
          const email = shared.data.invitations.find(invite => invite.athlete_id === item.id)?.email;
          const athlete: Athlete = { id: `shared-${item.id}`, name: item.name, events: [], group: 'sprints', pb: {}, status: 'active', ...(email ? { email } : {}), notes: `Groupe partagé : ${groupNames.get(item.group_id) ?? ''}` };
          addAthlete(athlete);
        }
        known.add(item.id); changed = true;
      }
      if (changed && !cancelled) await AsyncStorage.setItem(key, JSON.stringify([...known])).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [uid, user.userType, coachGroups, shared.data.athletes, shared.data.invitations, athletes, addAthlete, groupNames]);

  // 2. Plan sessions → sent to each linked athlete (only changed sessions are sent again).
  useEffect(() => {
    if (!uid || user.userType === 'athlete' || !links.size) return;
    const timer = setTimeout(() => {
      if (running.current) return;
      running.current = true;
      void (async () => {
        const cacheKey = `@appletics_published_sessions:${uid}`;
        const cache: Record<string, string> = JSON.parse((await AsyncStorage.getItem(cacheKey).catch(() => null)) || '{}');
        let changed = false;
        try {
          for (const plan of trainingPlans) {
            for (const localId of plan.athleteIds ?? []) {
              const sharedAthlete = links.get(localId);
              if (!sharedAthlete) continue;
              for (const session of plan.sessions ?? []) {
                if (session.type === 'rest' || session.intensity === 'rest') continue;
                for (const date of upcomingSessionDates(plan, session)) {
                  const source = `plan:${plan.id}:${session.id}:${date}:${sharedAthlete}`;
                  const details = [`Programme : ${plan.title}`, `${session.duration ? `${session.duration} min · ` : ''}Intensité : ${INTENSITY[session.intensity] ?? session.intensity}`, session.details?.trim()].filter(Boolean).join('\n');
                  const title = session.title.trim().slice(0, 200) || 'Séance';
                  const signature = hash(`${title}|${date}|${details}`);
                  if (cache[source] === signature) continue;
                  const { error } = await getSupabaseClient().rpc('shared_publish_athlete_session', { p_athlete: sharedAthlete, p_title: title, p_date: date, p_details: details, p_source: source });
                  if (error) { if (error.code === 'PGRST202') return; continue; } // database not updated yet: try again later
                  cache[source] = signature; changed = true;
                }
              }
            }
          }
        } finally {
          if (changed) { await AsyncStorage.setItem(cacheKey, JSON.stringify(cache)).catch(() => {}); void shared.refresh(); }
          running.current = false;
        }
      })();
    }, 2500);
    return () => clearTimeout(timer);
  }, [uid, user.userType, links, trainingPlans, shared.refresh]);
}
