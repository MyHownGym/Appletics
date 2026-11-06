import type { Language } from '@/constants/i18n';
// Stable role IDs and aliases preserve all existing profiles.
export const coachRoles: { id: string; labels: Record<Language, string>; aliases: string[] }[] = [
  { id: 'Head Coach', labels: { fr: 'Entraîneur en chef', de: 'Cheftrainer', it: 'Allenatore capo' }, aliases: ['head_coach'] },
  { id: 'Assistant Coach', labels: { fr: 'Entraîneur adjoint', de: 'Assistenztrainer', it: 'Allenatore assistente' }, aliases: ['assistant_coach', 'Entraîneur assistant'] },
  { id: 'Sprint Coach', labels: { fr: 'Entraîneur sprint', de: 'Sprinttrainer', it: 'Allenatore sprint' }, aliases: ['sprint_coach', 'Coach sprint'] },
  { id: 'Distance Coach', labels: { fr: 'Entraîneur demi-fond / fond', de: 'Mittel- und Langstreckentrainer', it: 'Allenatore mezzofondo / fondo' }, aliases: ['distance_coach', 'Coach demi-fond / fond'] },
  { id: 'Field Coach', labels: { fr: 'Entraîneur sauts / lancers', de: 'Sprung- und Wurftrainer', it: 'Allenatore salti / lanci' }, aliases: ['field_coach', 'Coach lancers / sauts'] },
  { id: 'Club Admin', labels: { fr: 'Administrateur du club', de: 'Vereinsadministrator', it: 'Amministratore del club' }, aliases: ['admin'] },
];
