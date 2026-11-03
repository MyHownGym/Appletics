import { coachRoles } from '@/constants/coachRoles';
import type { Language } from '@/constants/i18n';

export function normalizeCoachRole(role: string): string {
  const option = coachRoles.find(item => item.id === role || item.aliases.includes(role) || Object.values(item.labels).includes(role));
  return option?.id ?? role;
}

export function getCoachRoleLabel(role: string, language: Language = 'fr'): string {
  return coachRoles.find(item => item.id === normalizeCoachRole(role))?.labels[language] ?? role;
}

export function getCoachRoleOptions(language: Language) {
  return coachRoles.map(item => ({ id: item.id, label: item.labels[language] }));
}
