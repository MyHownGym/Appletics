import { EVENT_GROUPS } from '@/constants/config';
import { translations, type Language, type TranslationKey } from '@/constants/i18n';
import { normalizeGroupId } from '@/services/disciplineService';
import type { SharedGroup } from '@/types/sharedGroups';

export type TrainingGroupOperation = <T = unknown>(name: string, parameters: Record<string, unknown>) => Promise<T>;

export function disciplineOf(group?: Pick<SharedGroup, 'discipline'> | null): string {
  const id = normalizeGroupId(group?.discipline ?? 'all');
  return EVENT_GROUPS.some(item => item.id === id) ? id : 'all';
}

export function disciplineLabel(discipline: string, language: Language = 'fr'): string {
  const id = disciplineOf({ discipline });
  return translations[language][`group_${id}` as TranslationKey];
}

export async function updateTrainingGroup(
  operate: TrainingGroupOperation,
  groupId: string,
  name: string,
  discipline: string,
): Promise<void> {
  const cleanName = name.trim();
  const cleanDiscipline = normalizeGroupId(discipline);
  if (!groupId) throw new Error('Vous ne disposez pas de cet accès.');
  if (!cleanName || cleanName.length > 120) throw new Error('Le nom du groupe doit contenir entre 1 et 120 caractères.');
  if (!EVENT_GROUPS.some(item => item.id === cleanDiscipline)) throw new Error('Choisissez une discipline valide.');
  try {
    await operate('shared_update_group', {
      p_group: groupId,
      p_name: cleanName,
      p_discipline: cleanDiscipline,
    });
  } catch (reason) {
    if (reason instanceof Error && reason.message === 'function_missing') {
      throw new Error('La modification des groupes nécessite la mise à jour du schéma Cloud (shared_update_group).');
    }
    throw reason;
  }
}
