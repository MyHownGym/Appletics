import type { SessionMetric } from '@/types';
export interface SharedGroup { id: string; owner_id: string; name: string; created_at: string; discipline?: string }
export interface SharedMember { group_id: string; user_id: string; role: 'coach' | 'athlete'; display_name: string }
export interface SharedAthlete { id: string; group_id: string; user_id: string | null; name: string; source_id: string | null }
export interface SharedInvitation { id: string; group_id: string; group_name: string; email: string; role: 'coach' | 'athlete'; athlete_id: string | null; status: 'pending' | 'accepted' | 'declined' | 'revoked'; expires_at: string }
export interface SharedSession { id: string; group_id: string; title: string; session_date: string; details: string; source_key: string | null; athlete_id?: string | null; kind?: 'session' | 'competition'; meta?: Record<string, unknown>; created_by?: string | null }
export interface SharedPerformance { id: string; group_id: string; session_id: string; athlete_id: string; performed_on: string; metrics: SessionMetric[]; notes: string; created_by: string; updated_by: string; version: number; updated_at: string }
export interface SharedData { groups: SharedGroup[]; members: SharedMember[]; athletes: SharedAthlete[]; invitations: SharedInvitation[]; sessions: SharedSession[]; performances: SharedPerformance[] }
export const emptySharedData: SharedData = { groups: [], members: [], athletes: [], invitations: [], sessions: [], performances: [] };
