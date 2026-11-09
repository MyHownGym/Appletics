// Pure conversion rules between the coach's / athlete's device data and the shared (cloud) group data.
// Kept free of React so they can be tested and reasoned about on their own.
import type { Competition, CompResult, SessionMetric, SessionPerformance, TrainingPlan, TrainingSession } from '@/types';
import type { SharedPerformance, SharedSession } from '@/types/sharedGroups';

export const WINDOW_DAYS = 14;
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const INTENSITY: Record<string, string> = { easy: 'Facile', moderate: 'Modérée', hard: 'Difficile', race: 'Compétition', rest: 'Repos' };

export const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const todayKey = () => isoDay(new Date());
export const hash = (text: string) => { let value = 0; for (let index = 0; index < text.length; index++) value = (value * 31 + text.charCodeAt(index)) | 0; return String(value); };
const weekdayIndex = (key: string) => (new Date(`${key}T12:00:00`).getDay() + 6) % 7;
const slug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';

// ── Coach → cloud: what should exist for each linked athlete ─────────────────────────────
export interface DesiredItem { source: string; sharedAthlete: string; kind: 'session' | 'competition'; title: string; date: string; details: string; meta: Record<string, unknown> }

export function upcomingSessionDates(plan: TrainingPlan, session: TrainingSession, today = new Date()): string[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dates: string[] = [];
  for (let offset = 0; offset < WINDOW_DAYS; offset++) {
    const day = new Date(start); day.setDate(start.getDate() + offset);
    const key = isoDay(day);
    if (plan.startDate && key < plan.startDate.slice(0, 10)) continue;
    if (plan.endDate && key > plan.endDate.slice(0, 10)) continue;
    if (session.sessionDate) { if (session.sessionDate === key) dates.push(key); continue; }
    const index = weekdayIndex(key);
    if (session.day === WEEKDAYS_EN[index] || session.day === WEEKDAYS_FR[index]) dates.push(key);
  }
  return dates;
}

export function coachDesiredItems(plans: TrainingPlan[], competitions: Competition[], links: Map<string, string>, athleteNames: Map<string, string> = new Map(), today = new Date()): DesiredItem[] {
  const items: DesiredItem[] = [];
  for (const plan of plans) for (const localId of plan.athleteIds ?? []) {
    const sharedAthlete = links.get(localId); if (!sharedAthlete) continue;
    for (const session of plan.sessions ?? []) {
      if (session.type === 'rest' || session.intensity === 'rest') continue;
      for (const date of upcomingSessionDates(plan, session, today)) items.push({
        source: `plan:${plan.id}:${session.id}:${date}:${sharedAthlete}`, sharedAthlete, kind: 'session', date,
        title: session.title.trim().slice(0, 200) || 'Séance',
        details: [`Programme : ${plan.title}`, `${session.duration ? `${session.duration} min · ` : ''}Intensité : ${INTENSITY[session.intensity] ?? session.intensity}`, session.details?.trim()].filter(Boolean).join('\n'),
        meta: { planId: plan.id, planTitle: plan.title, sessionId: session.id, type: session.type, intensity: session.intensity, duration: session.duration ?? 0, phase: plan.phase },
      });
    }
  }
  for (const competition of competitions) {
    if (competition.status === 'cancelled') continue;
    // Everyone the coach registered (names only), so each athlete sees who else is going.
    const teammates = (competition.athleteIds ?? []).map(id => ({ id: links.get(id) ?? id, name: athleteNames.get(id) ?? '' })).filter(item => item.name).slice(0, 60);
    for (const localId of competition.athleteIds ?? []) {
      const sharedAthlete = links.get(localId); if (!sharedAthlete) continue;
      items.push({
        source: `comp:${competition.id}:${sharedAthlete}`, sharedAthlete, kind: 'competition', date: competition.date.slice(0, 10),
        title: competition.name.trim().slice(0, 200) || 'Compétition',
        details: [competition.venue, competition.location, competition.events?.length ? `Épreuves : ${competition.events.join(', ')}` : ''].filter(Boolean).join(' · '),
        meta: { competitionId: competition.id, type: competition.type, venue: competition.venue ?? '', location: competition.location ?? '', endDate: competition.endDate ?? '', events: competition.events ?? [], teammates: teammates.filter(item => item.id !== sharedAthlete) },
      });
    }
  }
  return items;
}

// Published rows that should no longer exist (athlete removed, session deleted). Past sessions are kept.
// superseded: older records of a linked person in another group (athlete moved to « Sprint »…). What this coach
// published there is withdrawn too, otherwise the athlete would receive every session twice.
export function staleRows(rows: SharedSession[], desired: Set<string>, linkedShared: Set<string>, today = todayKey(), coachId = '', superseded: Set<string> = new Set()): string[] {
  return rows.filter(row => row.source_key && row.athlete_id && (linkedShared.has(row.athlete_id) || (!!coachId && row.created_by === coachId && superseded.has(row.athlete_id)))
    && (row.source_key.startsWith('plan:') || row.source_key.startsWith('comp:'))
    && row.session_date >= today && !desired.has(row.source_key)).map(row => row.id);
}

// ── Performances: one canonical form for both directions (avoids sending back what was just received) ──
export function canonical(date: string, metrics: SessionMetric[], notes: string) {
  const sorted = [...metrics].map(item => ({ label: item.label.trim(), value: item.value.trim(), unit: (item.unit ?? '').trim() })).sort((a, b) => a.label.localeCompare(b.label));
  return hash(`${date}|${JSON.stringify(sorted)}|${notes.trim()}`);
}

interface CompetitionNotes { ranks?: Record<string, number>; notes?: Record<string, string> }
export function readCompetitionNotes(notes: string): CompetitionNotes { try { const value = JSON.parse(notes); return value && typeof value === 'object' ? value : {}; } catch { return {}; } }

// Notes of a shared performance, readable: competition notes are stored as JSON (ranks / remarks per event).
export function describeNotes(notes: string | null | undefined): { ranks: Record<string, number>; remarks: Record<string, string>; text: string; structured: boolean } {
  const raw = (notes ?? '').trim();
  if (raw.startsWith('{')) {
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === 'object' && ('ranks' in value || 'notes' in value || 'text' in value)) {
        return { ranks: value.ranks ?? {}, remarks: value.notes ?? {}, text: typeof value.text === 'string' ? value.text : '', structured: true };
      }
    } catch { /* plain text */ }
  }
  return { ranks: {}, remarks: {}, text: raw, structured: false };
}

// Local competition results of one athlete → one shared performance (one metric per event).
export function resultsToPerformance(results: CompResult[]) {
  const sorted = [...results].sort((a, b) => a.event.localeCompare(b.event));
  const ranks: Record<string, number> = {}; const remarks: Record<string, string> = {};
  for (const item of sorted) { if (item.rank) ranks[item.event] = item.rank; if (item.notes?.trim()) remarks[item.event] = item.notes.trim(); }
  const metrics: SessionMetric[] = sorted.map(item => ({ label: item.event, value: item.result, unit: '' }));
  const notes = JSON.stringify({ ranks, ...(Object.keys(remarks).length ? { notes: remarks } : {}) });
  return { metrics, notes };
}

// Shared competition performance → local results for one athlete/competition.
export function performanceToResults(performance: SharedPerformance, competitionId: string, athleteId: string): CompResult[] {
  const extra = readCompetitionNotes(performance.notes);
  return performance.metrics.filter(item => item.label?.trim() && item.value?.trim()).map(item => ({
    id: `cr-${performance.id}-${slug(item.label)}`, competitionId, athleteId, event: item.label, result: item.value,
    rank: Number(extra.ranks?.[item.label] ?? 0) || 0, pb: false, notes: extra.notes?.[item.label] ?? '',
  }));
}

export function performanceToSession(performance: SharedPerformance, sessionId: string, planId: string, athleteId: string, athleteName: string): SessionPerformance {
  return { id: `sp-${performance.id}`, sessionId, planId, athleteId, athleteName, date: performance.performed_on, metrics: performance.metrics, notes: performance.notes ?? '' };
}

// Source keys: plan:<planId>:<sessionId>:<date>:<sharedAthlete> · comp:<competitionId>:<sharedAthlete>
export function parseSource(source: string | null | undefined) {
  if (!source) return null;
  const parts = source.split(':');
  if (parts[0] === 'plan' && parts.length >= 5) return { kind: 'plan' as const, planId: parts[1], sessionId: parts[2], date: parts[3], sharedAthlete: parts[4] };
  if (parts[0] === 'comp' && parts.length >= 3) return { kind: 'comp' as const, competitionId: parts[1], sharedAthlete: parts[2] };
  return null;
}

// ── Cloud → athlete: the coach's items as the athlete's own plan and competitions ─────────
export function athletePlanFor(groupId: string, groupName: string, rows: SharedSession[], athleteId: string, existing?: TrainingPlan): TrainingPlan | null {
  const sessionRows = rows.filter(row => (row.kind ?? 'session') === 'session').sort((a, b) => a.session_date.localeCompare(b.session_date));
  if (!sessionRows.length) return null;
  const sessions: TrainingSession[] = sessionRows.map(row => {
    const meta = row.meta ?? {};
    return {
      id: `ss-${row.id}`, day: WEEKDAYS_FR[weekdayIndex(row.session_date)], sessionDate: row.session_date, title: row.title,
      type: (meta.type as TrainingSession['type']) || 'track', intensity: (meta.intensity as TrainingSession['intensity']) || 'moderate',
      duration: Number(meta.duration ?? 0) || 0, details: row.details ?? '',
    };
  });
  const startDate = sessionRows[0].session_date, endDate = sessionRows[sessionRows.length - 1].session_date;
  const weeks = Math.max(1, Math.ceil((new Date(`${endDate}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) / (7 * 864e5)) + 1);
  return { id: `shared-plan-${groupId}`, title: existing?.title ?? `Programme · ${groupName}`, phase: existing?.phase ?? 'Saison', group: existing?.group ?? 'all', athleteIds: [athleteId], startDate, endDate, weeks, description: 'Séances envoyées par votre coach.', sessions };
}

export function athleteCompetitionFor(row: SharedSession, athleteId: string): Competition {
  const meta = row.meta ?? {};
  const date = row.session_date;
  return {
    id: `shared-comp-${row.id}`, name: row.title, type: String(meta.type ?? 'meeting'), date, venue: String(meta.venue ?? ''),
    ...(meta.location ? { location: String(meta.location) } : {}), ...(meta.endDate ? { endDate: String(meta.endDate) } : {}),
    status: date < todayKey() ? 'completed' : 'upcoming', events: Array.isArray(meta.events) ? (meta.events as string[]) : [], athleteIds: [athleteId],
    teammates: Array.isArray(meta.teammates) ? (meta.teammates as { id?: unknown; name?: unknown }[]).filter(item => typeof item?.name === 'string' && item.name && item.id !== row.athlete_id).map(item => ({ id: String(item.id ?? item.name), name: String(item.name) })) : [],
  };
}

export const planSignature = (plan: TrainingPlan) => hash(JSON.stringify([plan.title, plan.startDate, plan.endDate, plan.sessions.map(item => [item.id, item.sessionDate, item.title, item.details, item.type, item.intensity, item.duration])]));
export const competitionSignature = (competition: Competition) => hash(JSON.stringify([competition.name, competition.date, competition.venue, competition.location, competition.endDate, competition.events, competition.type, competition.teammates ?? []]));
