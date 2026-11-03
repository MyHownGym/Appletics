import { memo, useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { EVENT_GROUPS } from '@/constants/config';
import { useI18n } from '@/hooks/useI18n';
import { useResponsive } from '@/hooks/useResponsive';
import { useAthleteDetail } from '@/hooks/useAthleteDetail';
import { PerformanceChart } from '@/components/feature/PerformanceChart';
import { AthleteSeasonFilter } from '@/components/feature/AthleteSeasonFilter';
import { normalizeEvent } from '@/services/athletePerformanceService';
import { getAthleteSearchUrl } from '@/services/swissAthleticsService';
import { Competition } from '@/types';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { SubscriptionFeatureGate } from '@/components/feature/SubscriptionFeatureGate';
import { SharedAthleteHistory } from '@/components/feature/SharedAthleteHistory';

type Tab = 'overview' | 'stats' | 'competitions';
type DetailItem = { kind: 'pb'; id: string; event: string; performance: string }
  | { kind: 'chart'; id: string; event: string }
  | { kind: 'competition'; id: string; competition: Competition };
interface EmptyPanelProps { text: string }
const EmptyPanel = memo(function EmptyPanel({ text }: EmptyPanelProps) {
  return <View style={styles.empty}><MaterialIcons name="insert-chart-outlined" size={28} color={Colors.textSecondary} /><Text style={styles.body}>{text}</Text></View>;
});

export default function AthleteDetailScreen() {
  const router = useRouter();
  const { openLink } = useExternalLinks();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const detail = useAthleteDetail(id);
  const { t, locale } = useI18n();
  const { maxContentWidth } = useResponsive();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const athlete = detail.athlete;
  const isStats = activeTab === 'stats';
  const chartEvent = selectedEvent && detail.seasonEvents.includes(selectedEvent) ? selectedEvent : detail.seasonEvents[0];
  const seasonLabel = detail.selectedSeason === null ? 'Toutes les saisons' : `Saison ${detail.selectedSeason}`;
  const group = EVENT_GROUPS.find(item => item.id === athlete?.group || (athlete?.group === 'middle_distance' && item.id === 'distance'));
  const accent = group?.color ?? Colors.primary;
  const statusColor = athlete?.status === 'active' ? Colors.success : athlete?.status === 'injured' ? Colors.error : Colors.textSecondary;
  const data: DetailItem[] = !athlete ? [] : activeTab === 'overview'
    ? Object.entries(athlete.pb).map(([event, performance]) => ({ kind: 'pb', id: event, event, performance }))
    : activeTab === 'stats' ? (chartEvent ? [{ kind: 'chart', id: chartEvent, event: chartEvent }] : [])
    : detail.athleteCompetitions.map(competition => ({ kind: 'competition', id: competition.id, competition }));
  const tabs: { id: Tab; label: string }[] = [{ id: 'overview', label: 'Aperçu' }, { id: 'stats', label: 'Stats' }, { id: 'competitions', label: 'Compétitions' }];

  if (!athlete) {
    return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><Pressable style={({ pressed }) => [styles.textButton, pressed ? styles.pressed : null]} onPress={() => router.back()}><Text style={styles.link}>{t('back')}</Text></Pressable><EmptyPanel text="Athlète introuvable" /></SafeAreaView>;
  }

  const renderItem = ({ item }: { item: DetailItem }) => {
    if (item.kind === 'pb') return (
      <View style={[styles.pbRow, Shadow.card]}>
        <View style={[styles.eventDot, { backgroundColor: accent }]} />
        <Text style={styles.pbEvent}>{item.event}</Text>
        <View style={styles.pbValueBlock}><Text style={[styles.pbValue, { color: accent }]}>{item.performance}</Text><View style={styles.pbBadge}><MaterialIcons name="star" size={12} color={Colors.warning} /><Text style={styles.pbBadgeText}>PB</Text></View></View>
      </View>
    );
    if (item.kind === 'chart') return (
      <View style={[styles.card, Shadow.card]}>
        <Text style={styles.cardTitle}>{item.event}</Text>
        <Text style={styles.subtle}>{detail.seasonEventCounts[normalizeEvent(item.event)] ?? 0} résultats enregistrés · {seasonLabel}</Text>
        <PerformanceChart key={`${item.event}-${detail.selectedSeason ?? 'all'}`} results={detail.seasonResults} event={item.event} accentColor={accent} competitions={detail.competitions} />
      </View>
    );
    const competition = item.competition;
    const entries = detail.athleteResults.filter(result => result.competitionId === competition.id);
    return (
      <Pressable style={({ pressed }) => [styles.card, Shadow.card, pressed ? styles.pressed : null]} onPress={() => router.push({ pathname: '/competition-detail', params: { id: competition.id } })}>
        <View style={styles.competitionTop}><View style={styles.competitionHeading}><Text verbatim style={styles.cardTitle}>{competition.name}</Text><Text style={styles.subtle}>{new Date(competition.date + 'T00:00:00').toLocaleDateString(locale)} · {competition.venue}</Text></View><MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} /></View>
        <Text style={[styles.status, { color: competition.status === 'completed' ? Colors.success : Colors.primary }]}>{competition.status === 'completed' ? 'Terminée' : competition.status === 'upcoming' ? 'À venir' : 'Annulée'}</Text>
        <FlatList scrollEnabled={false} data={entries} keyExtractor={result => result.id} renderItem={({ item: result }) => <View style={styles.competitionResult}><Text style={styles.body}>{result.event}</Text><Text style={styles.resultValue}>{result.result}{result.pb ? ' · PB' : ''}</Text></View>} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} /></Pressable>
        <Text verbatim style={styles.headerTitle} numberOfLines={1}>{athlete.name}</Text>
        <Pressable onPress={detail.exportPdf} disabled={detail.exporting} accessibilityLabel="Exporter la fiche PDF" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>{detail.exporting ? <ActivityIndicator color={Colors.error} /> : <MaterialIcons name="picture-as-pdf" size={21} color={Colors.error} />}</Pressable>
        {detail.canEdit ? <Pressable onPress={detail.remove} accessibilityLabel="Supprimer cet athlète" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="delete-outline" size={22} color={Colors.error} /></Pressable> : null}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        extraData={`${activeTab}-${detail.selectedSeason ?? 'all'}`}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { maxWidth: maxContentWidth }]}
        ListHeaderComponent={
          <>
            <LinearGradient colors={[accent + '22', Colors.surface]} style={[styles.hero, Shadow.card]}>
              {athlete.avatar ? <Image source={{ uri: athlete.avatar }} contentFit="cover" transition={200} style={styles.avatar} /> : <View style={[styles.avatarFallback, { backgroundColor: accent + '18' }]}><Text style={[styles.initials, { color: accent }]}>{athlete.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</Text></View>}
              <Text verbatim style={styles.name}>{athlete.name}</Text>
              <View style={styles.badges}><Text style={[styles.badge, { color: accent, backgroundColor: accent + '12' }]}>{group ? t(group.labelKey as any) : athlete.group}</Text><Text style={[styles.badge, { color: statusColor, backgroundColor: statusColor + '12' }]}>{t(athlete.status)}</Text></View>
              <Text style={styles.disciplines}>{athlete.events.join(' · ') || 'Aucune discipline renseignée'}</Text>
              {isStats ? <Text accessibilityLiveRegion="polite" style={styles.seasonScope}>{seasonLabel}</Text> : null}
              <View style={styles.kpis}>
                <View style={styles.kpi}><Text style={[styles.kpiNumber, { color: accent }]}>{isStats ? detail.seasonResults.length : detail.athleteResults.length}</Text><Text style={styles.kpiLabel}>Résultats</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiNumber, { color: Colors.warning }]}>{isStats ? detail.seasonPbs : detail.pbs}</Text><Text style={styles.kpiLabel}>PBs établis</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiNumber, { color: Colors.warning }]}>{isStats ? detail.seasonWins : detail.wins}</Text><Text style={styles.kpiLabel}>Victoires</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiNumber, { color: Colors.success }]}>{isStats ? detail.seasonCompetitionCount : detail.currentSeasonResults.length}</Text><Text style={styles.kpiLabel}>{isStats ? 'Compétitions' : detail.currentYear}</Text></View>
              </View>
            </LinearGradient>
            {detail.canEdit ? <Pressable style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]} onPress={() => router.push({ pathname: '/athlete-add', params: { id: athlete.id } })}><MaterialIcons name="edit" size={18} color={Colors.primary} /><Text style={styles.link}>Modifier la fiche athlète</Text><MaterialIcons name="chevron-right" size={20} color={Colors.primary} /></Pressable> : null}
            <View style={styles.tabs}>{tabs.map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.id }} onPress={() => setActiveTab(tab.id)} style={({ pressed }) => [styles.tab, activeTab === tab.id ? { backgroundColor: accent, borderColor: accent } : null, pressed ? styles.pressed : null]}><Text style={[styles.tabLabel, activeTab === tab.id ? styles.textOnPrimary : null]}>{tab.label}</Text></Pressable>)}</View>
            {isStats ? <AthleteSeasonFilter years={detail.availableYears} selectedYear={detail.selectedSeason} onSelect={detail.selectSeason} resultCount={detail.seasonResults.length} accentColor={accent} /> : null}
            <View style={styles.sectionHeading}><View style={[styles.accent, { backgroundColor: accent }]} /><Text style={styles.sectionTitle}>{activeTab === 'overview' ? 'Records personnels (PBs)' : activeTab === 'stats' ? 'Évolution des performances' : 'Historique des compétitions'}</Text></View>
            {isStats && detail.seasonEvents.length ? <View style={styles.filterBar}><FlatList horizontal data={detail.seasonEvents} keyExtractor={event => event} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} renderItem={({ item: event }) => <Pressable onPress={() => setSelectedEvent(event)} accessibilityState={{ selected: chartEvent === event }} style={({ pressed }) => [styles.filterChip, chartEvent === event ? { backgroundColor: accent, borderColor: accent } : null, pressed ? styles.pressed : null]}><Text style={[styles.filterText, chartEvent === event ? styles.textOnPrimary : null]}>{event}</Text></Pressable>} /></View> : null}
          </>
        }
        ListEmptyComponent={<EmptyPanel text={activeTab === 'overview' ? 'Aucun PB enregistré' : isStats ? detail.selectedSeason === null ? 'Ajoutez des résultats de compétition pour voir la progression.' : `Aucun résultat pour la saison ${detail.selectedSeason}. Choisissez une autre année ou « Toutes ».` : 'Aucune compétition pour cet athlète'} />}
        ListFooterComponent={
          activeTab === 'overview' ? (
            <>
              <SharedAthleteHistory athleteId={athlete.id} />
              <View style={styles.card}><Text style={styles.cardTitle}>Informations de l’athlète</Text>{athlete.email ? <Text style={styles.body}>E-mail : {athlete.email}</Text> : null}{athlete.phone ? <Text style={styles.body}>Téléphone : {athlete.phone}</Text> : null}{athlete.birthYear ? <Text style={styles.body}>Naissance : {athlete.birthYear}</Text> : null}{athlete.club ? <Text verbatim style={styles.body}>{t('Club :')} {athlete.club}</Text> : null}{athlete.licenseNumber ? <Text style={styles.body}>Licence : {athlete.licenseNumber}</Text> : null}{athlete.notes ? <Text verbatim style={styles.body}>{athlete.notes}</Text> : null}</View>
              <Pressable style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]} onPress={() => openLink(getAthleteSearchUrl(athlete.name))}><MaterialIcons name="open-in-new" size={20} color={Colors.primary} /><View style={styles.competitionHeading}><Text style={styles.cardTitle}>Swiss Athletics</Text><Text style={styles.subtle}>Rechercher les résultats officiels</Text></View></Pressable>
            </>
          ) : activeTab === 'stats' ? (
            detail.canCompare ? <>
              <View style={styles.sectionHeading}><View style={[styles.accent, { backgroundColor: Colors.info }]} /><Text style={styles.sectionTitle}>Comparaison {detail.comparisonPrevYear} / {detail.comparisonYear}</Text></View>
              {detail.comparisons.length ? <FlatList scrollEnabled={false} data={detail.comparisons} keyExtractor={item => item.event} renderItem={({ item }) => <View style={styles.card}><View style={styles.competitionTop}><Text style={styles.cardTitle}>{item.event}</Text><Text style={[styles.status, { color: item.better ? Colors.success : Colors.error }]}>{item.better ? 'Progression' : 'Évolution'} {item.change.toFixed(1)} %</Text></View><View style={styles.comparisonRow}><Text style={styles.body}>{detail.comparisonPrevYear}</Text><Text style={styles.resultValue}>{item.previous}</Text></View><View style={styles.comparisonRow}><Text style={styles.body}>{detail.comparisonYear}</Text><Text style={[styles.resultValue, { color: accent }]}>{item.current}</Text></View></View>} /> : <EmptyPanel text={`Données insuffisantes pour comparer les saisons ${detail.comparisonPrevYear} et ${detail.comparisonYear}`} />}
            </> : <SubscriptionFeatureGate feature="season_comparison" title="Comparaison détaillée entre saisons" />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  headerTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  list: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: Spacing.md, paddingBottom: Spacing.xl },
  hero: { padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: Radius.full },
  avatarFallback: { width: 72, height: 72, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold },
  name: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold },
  disciplines: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  seasonScope: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, lineHeight: 26, textAlign: 'center', includeFontPadding: false },
  kpis: { width: '100%', flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm, gap: Spacing.xs },
  kpi: { flex: 1, alignItems: 'center' },
  kpiNumber: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold },
  kpiLabel: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  editButton: { minHeight: 48, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary + '30', backgroundColor: Colors.primaryLight, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  link: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.primary, flex: 1 },
  textButton: { padding: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: { flex: 1, minHeight: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs },
  tabLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  textOnPrimary: { color: Colors.textOnPrimary },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  accent: { width: 4, height: 20, borderRadius: Radius.full },
  sectionTitle: { flex: 1, fontSize: Typography.fontSizeMD, color: Colors.textPrimary, fontWeight: Typography.weightBold },
  pbRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  eventDot: { width: 8, height: 8, borderRadius: Radius.full },
  pbEvent: { flex: 1, minWidth: 80, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  pbValueBlock: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  pbValue: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold },
  pbBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.warning + '12', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  pbBadgeText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.warning },
  card: { padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  cardTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, flexShrink: 1 },
  subtle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 21 },
  body: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26, flexShrink: 1 },
  empty: { padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: Radius.lg, marginBottom: Spacing.md },
  filterBar: { minHeight: 48, marginBottom: Spacing.md },
  filterContent: { alignItems: 'center', gap: Spacing.sm },
  filterChip: { minHeight: 48, paddingHorizontal: Spacing.md, justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, backgroundColor: Colors.surface },
  filterText: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  competitionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  competitionHeading: { flex: 1 },
  competitionResult: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  resultValue: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary, flexShrink: 1 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  status: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold },
  pressed: { opacity: 0.75 },
});
