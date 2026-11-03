import type { Language } from '@/constants/i18n';
export const profileLabels: Record<Language, { first_name: string; last_name: string }> = {
  fr: { first_name: 'Prénom', last_name: 'Nom' },
  de: { first_name: 'Vorname', last_name: 'Nachname' },
  it: { first_name: 'Nome', last_name: 'Cognome' },
};
