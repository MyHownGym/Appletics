// Powered by OnSpace.AI
// v6 - SessionPerformance type added
export interface Athlete {
  id: string;
  name: string;
  events: string[];
  group: string;
  pb: Record<string, string>;
  status: 'active' | 'injured' | 'inactive';
  email?: string;
  phone?: string;
  birthYear?: number;
  club?: string;
  licenseNumber?: string;
  avatar?: string;
  notes?: string;
  // Manual baseline stays separate from bests calculated from competition results.
  manualPb?: Record<string, string>;
}

export interface TrainingSession {
  id: string;
  day: string;
  sessionDate?: string; // YYYY-MM-DD, overrides weekday if set
  title: string;
  type: 'track' | 'gym' | 'road' | 'rest' | 'pool' | 'other';
  intensity: 'easy' | 'moderate' | 'hard' | 'race' | 'rest';
  duration: number; // minutes
  details: string;
}

export interface TrainingPlan {
  id: string;
  groupSessions?: boolean; // athlete side: sessions published for a whole group, without a plan
  title: string;
  phase: string;
  group: string;
  athleteIds: string[];
  startDate: string;
  endDate: string;
  weeks: number;
  description: string;
  sessions: TrainingSession[];
}

export interface Competition {
  id: string;
  name: string;
  type: string;
  date: string;
  venue: string;
  location?: string;
  endDate?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  events: string[];
  athleteIds: string[];
  // Athlete side: the other athletes of the coach registered for this competition (names only).
  teammates?: { id: string; name: string }[];
  teamScore?: number;
  teamRank?: number;
}

export interface CompResult {
  id: string;
  competitionId: string;
  athleteId: string;
  event: string;
  result: string;
  rank: number;
  pb: boolean;
  notes: string;
}

export interface ChatMember {
  id: string;
  name: string;
  role: 'coach' | 'athlete' | 'admin';
  avatar?: string | null;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'staff' | 'group' | 'admin';
  memberCount: number;
  members: ChatMember[];
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export interface NotifSettings {
  notif_new_plan: boolean;
  notif_session_reminder: boolean;
  notif_plan_updated: boolean;
  notif_new_competition: boolean;
  notif_competition_reminder: boolean;
  notif_result_posted: boolean;
  notif_new_message: boolean;
  notif_athlete_added: boolean;
  notif_weekly_summary: boolean;
  [key: string]: boolean;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  club: string;
  avatar: string | null;
  email: string;
  userType?: 'coach' | 'athlete';
  pin?: string;
  biometricEnabled?: boolean;
  // Optional self-reported roster size, not the number of created athlete records.
  coachAthleteCount?: number;
  // Club/org subscription type
  accountType?: 'indie' | 'club';
  isClubAdmin?: boolean;
  clubId?: string;
}

// Performance logged by an athlete for a training session
export interface SessionPerformance {
  id: string;
  sessionId: string;
  planId: string;
  athleteId: string;
  athleteName: string;
  date: string; // YYYY-MM-DD
  metrics: SessionMetric[];
  notes?: string;
}

export interface SessionMetric {
  label: string; // ex. "100m", "Saut en longueur"
  value: string; // ex. "11.2", "6.45"
  unit: string;  // ex. "s", "m", "kg"
}

// Subscription types for two user segments
export type IndieSubscriptionTier = 'basic' | 'pro' | 'elite';
export type ClubSubscriptionTier = 'club_basic' | 'club_pro' | 'club_elite';
