import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useSubscription } from '@/hooks/useSubscription';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { useI18n } from '@/hooks/useI18n';
import { AthleteSeason, getAthleteSeasonStats, getCompetitionYear } from '@/services/athleteStatsService';
import { exportAthleteProfile } from '@/services/pdfExportService';

export function useAthleteDetail(id: string) {
  const { athletes, results, competitions, deleteAthlete, user } = useApp();
  const { hasFeature } = useSubscription();
  const { showAlert } = useAlert();
  const { language } = useI18n();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<AthleteSeason>(null);
  const selectSeason = useCallback((season: AthleteSeason) => setSelectedSeason(season), []);
  const athlete = athletes.find(item => item.id === id);
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const canEdit = user.userType !== 'athlete' && !user.isClubAdmin;
  const stats = useMemo(() => {
    const athleteResults = results.filter(result => result.athleteId === id);
    const eventsWithResults = [...new Set(athleteResults.map(result => result.event))];
    const resultCompetitionIds = new Set(athleteResults.map(result => result.competitionId));
    const athleteCompetitions = competitions.filter(comp => comp.athleteIds.includes(id) || resultCompetitionIds.has(comp.id))
      .sort((a, b) => b.date.localeCompare(a.date));
    const availableYears = [...new Set([currentYear, ...athleteCompetitions
      .map(comp => getCompetitionYear(comp.date)).filter((year): year is number => year !== null)])]
      .sort((a, b) => b - a);
    const currentCompetitionIds = new Set(competitions.filter(comp => getCompetitionYear(comp.date) === currentYear).map(comp => comp.id));
    const currentSeasonResults = athleteResults.filter(result => currentCompetitionIds.has(result.competitionId));
    return { athleteResults, eventsWithResults, currentSeasonResults, athleteCompetitions, availableYears,
      ...getAthleteSeasonStats(athleteResults, competitions, selectedSeason, currentYear),
      wins: athleteResults.filter(result => result.rank === 1).length,
      pbs: athleteResults.filter(result => result.pb).length };
  }, [results, competitions, id, currentYear, selectedSeason]);

  const remove = useCallback(() => {
    if (!athlete || !canEdit) return;
    showAlert('Supprimer cet athlète ?', 'La fiche sera retirée de votre liste.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { deleteAthlete(athlete.id); router.back(); } },
    ]);
  }, [athlete, canEdit, showAlert, deleteAthlete, router]);
  const exportPdf = useCallback(async () => {
    if (!athlete || exporting) return;
    if (!hasFeature('pdf_export')) {
      if (user.userType === 'athlete') showAlert('Export PDF', 'Cette fonctionnalité dépend de la formule de votre coach.');
      else router.push({ pathname: '/upgrade', params: { tier: user.accountType === 'club' ? 'club_pro' : 'elite', reason: 'Export PDF de la fiche athlète' } });
      return;
    }
    setExporting(true);
    try { await exportAthleteProfile(athlete, results, competitions, language); }
    catch { showAlert('Erreur', 'Impossible de générer le PDF.'); }
    finally { setExporting(false); }
  }, [athlete, exporting, hasFeature, user.userType, showAlert, router, results, competitions, language]);
  return { canCompare: hasFeature('season_comparison'), athlete, competitions, ...stats, selectedSeason, selectSeason, canEdit, currentYear, prevYear, exporting, remove, exportPdf };
}
