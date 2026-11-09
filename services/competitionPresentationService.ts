import type { Competition } from '@/types';
import { Language, translations } from '@/constants/i18n';
import { isCompetitionOngoing } from '@/services/competitionStatusService';
const typeLabels: Record<Language, Record<string, string>> = {
  fr: { Indoor: 'Salle', Outdoor: 'Plein air', Championship: 'Championnat', Invitational: 'Meeting', 'Cross Country': 'Cross-country', 'Road Race': 'Route' },
  de: { Indoor: 'Halle', Outdoor: 'Freiluft', Championship: 'Meisterschaft', Invitational: 'Meeting', 'Cross Country': 'Crosslauf', 'Road Race': 'Straßenlauf' },
  it: { Indoor: 'Al coperto', Outdoor: 'All’aperto', Championship: 'Campionato', Invitational: 'Meeting', 'Cross Country': 'Cross', 'Road Race': 'Strada' },
};
export function getCompetitionPresentation(competition: Competition, language: Language) {
  return {
    statusLabel: isCompetitionOngoing(competition) ? ({ fr: 'En cours', de: 'Läuft', it: 'In corso' } as Record<string, string>)[language] ?? 'En cours' : translations[language][competition.status],
    ongoing: isCompetitionOngoing(competition),
    typeLabel: typeLabels[language][competition.type] ?? competition.type,
    venueLabel: [...new Set([competition.venue, competition.location].filter(Boolean))].join(', '),
    date: new Date(`${competition.date.slice(0, 10)}T12:00:00`),
  };
}
