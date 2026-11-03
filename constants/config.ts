// Powered by OnSpace.AI
// Shared configuration — all labels via i18n keys
import { IntensityColors } from '@/constants/theme';

export const APP_NAME = 'Appletics';

export const EVENT_GROUPS = [
  { id: 'all',      labelKey: 'all',      label: 'Tous',        color: '#FFD700' },
  { id: 'sprints',  labelKey: 'sprints',  label: 'Sprints',     color: '#FF6B35' },
  { id: 'distance', labelKey: 'distance', label: 'Demi-fond',   color: '#60A5FA' },
  { id: 'hurdles',  labelKey: 'hurdles',  label: 'Haies',       color: '#F472B6' },
  { id: 'jumps',    labelKey: 'jumps',    label: 'Sauts',       color: '#A78BFA' },
  { id: 'throws',   labelKey: 'throws',   label: 'Lancers',     color: '#F59E0B' },
  { id: 'relay',    labelKey: 'relay',    label: 'Relais',      color: '#34D399' },
];

export const TRACK_EVENTS = [
  '60m', '100m', '200m', '400m',
  '800m', '1500m', '3000m', '5000m', '10000m',
  '60m Haies', '100m Haies', '110m Haies', '400m Haies',
  '4x100m Relais', '4x400m Relais',
  'Saut en longueur', 'Triple saut', 'Saut en hauteur', 'Saut à la perche',
  'Lancer du poids', 'Lancer du disque', 'Lancer du marteau', 'Lancer du javelot',
];

// Days keyed for translation (used in session forms)
export const DAYS_OF_WEEK_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Fallback labels for days (overridden by i18n in components)
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PLAN_PHASES = ['Base', 'Build', 'Peak', 'Taper', 'Competition', 'Recovery'];

export const INTENSITY_LEVELS = [
  { id: 'easy',     labelKey: 'intensity_easy',     color: IntensityColors.easy },
  { id: 'moderate', labelKey: 'intensity_moderate', color: IntensityColors.moderate },
  { id: 'hard',     labelKey: 'intensity_hard',     color: IntensityColors.hard },
  { id: 'race',     labelKey: 'intensity_race',     color: IntensityColors.race },
  { id: 'rest',     labelKey: 'intensity_rest',     color: IntensityColors.rest },
] as const;

export function getIntensityColor(intensity: string): string {
  return INTENSITY_LEVELS.find(level => level.id === intensity)?.color ?? IntensityColors.rest;
}

export const MEET_TYPES = ['Indoor', 'Outdoor', 'Cross Country', 'Route', 'Championnat', 'Invitational'];

export const ROLES = {
  HEAD_COACH: 'Head Coach',
  ASSISTANT_COACH: 'Assistant Coach',
  ATHLETE: 'Athlete',
  ADMIN: 'Club Admin',
};

export const STAFF_CHANNELS = [
  { id: 'all-staff', name: 'All Staff', icon: 'people' },
  { id: 'coaches', name: 'Coaches Only', icon: 'supervisor-account' },
];
