// Powered by OnSpace.AI
// Date-based analytics with measured, font-scale-aware overview cards.
import { memo, useCallback } from 'react';
import { View, FlatList, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { useSubscription } from '@/hooks/useSubscription';
import { useI18n } from '@/hooks/useI18n';
import { AnalyticsOverview } from '@/components/feature/AnalyticsOverview';
import { TrainingLoadChart } from '@/components/feature/TrainingLoadChart';
import { useExternalLinks } from '@/hooks/useExternalLinks';

type AnalyticsSection = 'overview' | 'load' | 'availability' | 'groups' | 'performers' | 'trends' | 'swiss';
const sections: AnalyticsSection[] = ['overview', 'load', 'availability', 'groups', 'performers', 'trends', 'swiss'];
const eliteFeatures = [
  { icon: 'bar-chart', label: 'Charge d’entraînement sur 8 semaines' },
  { icon: 'people', label: 'Répartition et performance par groupe' },
  { icon: 'emoji-events', label: 'Classement des athlètes' },
  { icon: 'trending-up', label: 'Tendances de progression' },
  { icon: 'health-and-safety', label: 'Blessures et disponibilité' },
];
interface SectionHeadingProps { title: string; icon: string; color: string }
const SectionHeading = memo(function SectionHeading({ title, icon, color }: SectionHeadingProps) {
  return <View style={styles.sectionHeading}><View style={[styles.accent, { backgroundColor: color }]} /><MaterialIcons name={icon as any} size={22} color={color} /><Text style={styles.sectionTitle}>{title}</Text></View>;
});

export default function AnalyticsScreen() {
  const router = useRouter();
  const { openLink } = useExternalLinks();
  const { t } = useI18n();
  const { hasFeature, isClub } = useSubscription();
  // Hooks remain mounted when subscription access changes.
  const stats = useAdvancedAnalytics();
  const { maxContentWidth, screenPadding } = useResponsive();
  const allowed = hasFeature('advanced_analytics');
  const openOfficialResults = useCallback(() => {
    void openLink('https://www.swiss-athletics.ch/fr/competitions/resultats/');
  }, [openLink]);

  const renderSection = ({ item }: { item: AnalyticsSection }) => {
    if (item === 'overview') return <><SectionHeading title="Vue d’ensemble" icon="dashboard" color={Colors.primary} /><AnalyticsOverview stats={stats} /></>;
    if (item === 'load') return (
      <>
        <SectionHeading title="Charge d’entraînement · 8 semaines" icon="fitness-center" color={Colors.primary} />
        <View style={[styles.card, Shadow.card]}>
          <View style={styles.cardHeading}><Text style={styles.cardTitle}>Séances / semaine</Text><View style={[styles.trendBadge, { backgroundColor: stats.loadChange === null || stats.loadChange >= 0 ? Colors.success + '12' : Colors.error + '12' }]}><MaterialIcons name={stats.loadChange === null || stats.loadChange >= 0 ? 'trending-up' : 'trending-down'} size={18} color={stats.loadChange === null || stats.loadChange >= 0 ? Colors.success : Colors.error} /><Text style={[styles.badgeText, { color: stats.loadChange === null || stats.loadChange >= 0 ? Colors.success : Colors.error }]}>{stats.loadChange === null ? 'Comparaison indisponible' : `${stats.loadChange >= 0 ? '+' : ''}${stats.loadChange.toFixed(0)} % · 4 sem. précédentes`}</Text></View></View>
          <TrainingLoadChart data={stats.sessionsPerWeek} dates={stats.weekDates} color={Colors.primary} />
          <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.success }]} /><Text style={styles.body}>Hausse des séances</Text></View><View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.error }]} /><Text style={styles.body}>Baisse des séances</Text></View></View>
        </View>
      </>
    );
    if (item === 'availability') {
      const statuses = [{ id: 'active', label: 'Actifs', count: stats.activeAthletes, color: Colors.success }, { id: 'injured', label: 'Blessés', count: stats.injuredAthletes, color: Colors.error }, { id: 'inactive', label: 'Inactifs', count: stats.inactiveAthletes, color: Colors.textSecondary }];
      return (
        <>
          <SectionHeading title="Disponibilité de l’équipe" icon="health-and-safety" color={Colors.success} />
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.availabilityHeading}><View style={styles.donut}><Text style={styles.donutValue}>{stats.availabilityRate}%</Text></View><View style={styles.info}><Text style={styles.cardTitle}>Athlètes disponibles</Text><Text style={styles.body}>{stats.activeAthletes} actifs sur {stats.totalAthletes} athlètes</Text></View></View>
            <FlatList scrollEnabled={false} data={statuses} keyExtractor={row => row.id} renderItem={({ item: row }) => <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: row.color }]} /><Text style={styles.rowLabel}>{row.label}</Text><Text style={[styles.rowValue, { color: row.color }]}>{row.count}</Text></View>} />
            <Text style={styles.body}>Les athlètes blessés et inactifs ne sont pas comptés comme disponibles.</Text>
          </View>
        </>
      );
    }
    if (item === 'groups') return (
      <>
        <SectionHeading title="Répartition par groupe" icon="category" color={Colors.info} />
        <View style={[styles.card, Shadow.card]}>
          <FlatList scrollEnabled={false} data={stats.groupData} keyExtractor={group => group.id} ListEmptyComponent={<Text style={styles.body}>Aucun athlète enregistré</Text>} renderItem={({ item: group }) => <View style={styles.groupItem}><View style={styles.cardHeading}><Text style={styles.rowLabel}>{t(group.labelKey as any)}</Text><Text style={[styles.rowValue, { color: group.color }]}>{group.count}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${stats.totalAthletes ? group.count / stats.totalAthletes * 100 : 0}%`, backgroundColor: group.color }]} /></View><Text style={styles.body}>{group.results} résultat{group.results !== 1 ? 's' : ''}</Text></View>} />
        </View>
      </>
    );
    if (item === 'performers') return (
      <>
        <SectionHeading title="Top performers" icon="emoji-events" color={Colors.warning} />
        <View style={[styles.card, Shadow.card]}>
          <Text style={styles.body}>Classés par records personnels établis, puis par victoires.</Text>
          <FlatList scrollEnabled={false} data={stats.topPerformers} keyExtractor={row => row.athlete.id} ListEmptyComponent={<Text style={styles.body}>Ajoutez des résultats de compétition pour voir le classement.</Text>} renderItem={({ item: row, index }) => <Pressable onPress={() => router.push({ pathname: '/athlete-detail', params: { id: row.athlete.id } })} style={({ pressed }) => [styles.performer, pressed ? styles.pressed : null]}><View style={[styles.rank, { backgroundColor: row.color + '12' }]}><Text style={[styles.rankText, { color: row.color }]}>{index + 1}</Text></View><View style={styles.info}><Text verbatim style={styles.rowLabel}>{row.athlete.name}</Text><Text style={styles.body}>{row.pbs} PBs · {row.wins} victoire{row.wins !== 1 ? 's' : ''} · {row.total} résultats</Text>{row.bestResult ? <Text style={styles.body}>{row.bestResult.event} · {row.bestResult.result}</Text> : null}</View><MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} /></Pressable>} />
        </View>
      </>
    );
    if (item === 'trends') {
      const trends = [{ id: 'pbs', label: 'Taux de PB', value: `${stats.pbRate}%`, description: 'des résultats sont des records', color: Colors.warning, icon: 'star' }, { id: 'wins', label: 'Taux de victoire', value: `${stats.totalResults ? Math.round(stats.totalVictories / stats.totalResults * 100) : 0}%`, description: 'des participations gagnées', color: Colors.success, icon: 'emoji-events' }, { id: 'injuries', label: 'Blessures actives', value: String(stats.injuredAthletes), description: `sur ${stats.totalAthletes} athlètes`, color: stats.injuredAthletes ? Colors.error : Colors.success, icon: 'personal-injury' }];
      return <><SectionHeading title="Tendances de progression" icon="trending-up" color={Colors.success} /><View style={[styles.card, Shadow.card]}><FlatList scrollEnabled={false} data={trends} keyExtractor={row => row.id} renderItem={({ item: row }) => <View style={styles.performer}><MaterialIcons name={row.icon as any} size={24} color={row.color} /><View style={styles.info}><Text style={styles.rowLabel}>{row.label}</Text><Text style={styles.body}>{row.description}</Text></View><Text style={[styles.rowValue, { color: row.color }]}>{row.value}</Text></View>} /></View></>;
    }
    return <><SectionHeading title="Swiss Athletics" icon="public" color={Colors.error} /><Pressable onPress={openOfficialResults} style={({ pressed }) => [styles.card, styles.performer, Shadow.card, pressed ? styles.pressed : null]}><MaterialIcons name="public" size={26} color={Colors.error} /><View style={styles.info}><Text style={styles.rowLabel}>Résultats officiels</Text><Text style={styles.body}>Consulter les classements sur Swiss Athletics</Text></View><MaterialIcons name="open-in-new" size={22} color={Colors.error} /></Pressable></>;
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textOnPrimary} /></Pressable>
        <View style={styles.headerInfo}><Text style={styles.headerTitle}>Analyses avancées</Text><View style={styles.eliteBadge}><MaterialIcons name="workspace-premium" size={16} color={Colors.textOnPrimary} /><Text style={styles.eliteText}>ELITE</Text></View></View>
        <View style={styles.headerSpacer} />
      </LinearGradient>
      {allowed ? (
        <FlatList style={styles.list} data={sections} keyExtractor={section => section} renderItem={renderSection} extraData={stats} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { maxWidth: maxContentWidth, paddingHorizontal: screenPadding }]} />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.gateContent, { maxWidth: maxContentWidth, paddingHorizontal: screenPadding }]}>
          <View style={styles.gateIcon}><MaterialIcons name="analytics" size={48} color={Colors.primary} /></View>
          <Text style={styles.gateTitle}>Analyses avancées</Text><Text style={styles.gateBody}>Graphiques de charge d’entraînement, classements, comparaisons de groupes et tendances de progression, inclus dans la formule Elite.</Text>
          <View style={[styles.card, Shadow.card]}><FlatList scrollEnabled={false} data={eliteFeatures} keyExtractor={feature => feature.icon} renderItem={({ item }) => <View style={styles.performer}><MaterialIcons name={item.icon as any} size={24} color={Colors.primary} /><Text style={styles.rowLabel}>{item.label}</Text></View>} /></View>
          <Pressable style={({ pressed }) => [styles.upgradeButton, pressed ? styles.pressed : null]} onPress={() => router.push({ pathname: '/upgrade', params: { tier: isClub ? 'club_elite' : 'elite', reason: 'Analyses avancées requiert le plan Elite' } })}><MaterialIcons name="workspace-premium" size={24} color={Colors.textOnPrimary} /><Text style={styles.upgradeText}>{isClub ? 'Passer à Club Elite' : 'Passer à Elite'}</Text></Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  headerInfo: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textOnPrimary, textAlign: 'center', includeFontPadding: false },
  headerSpacer: { width: 48 },
  eliteBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.textOnPrimary + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  eliteText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary },
  content: { width: '100%', alignSelf: 'center', paddingBottom: Spacing.xl },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.md },
  accent: { width: 4, height: 24, borderRadius: Radius.full },
  sectionTitle: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false },
  card: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  cardHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, flexShrink: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: Spacing.xs, borderRadius: Radius.md, padding: Spacing.sm, maxWidth: '100%' },
  badgeText: { flexShrink: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, lineHeight: 26 },
  body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, flexShrink: 1, includeFontPadding: false },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  availabilityHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md },
  donut: { width: 96, height: 96, borderRadius: Radius.full, borderWidth: 8, borderColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  info: { flex: 1, minWidth: 80, gap: Spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  rowLabel: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, lineHeight: 26 },
  rowValue: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, flexShrink: 1 },
  groupItem: { paddingVertical: Spacing.sm, gap: Spacing.sm },
  progressTrack: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: Radius.full },
  performer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  rank: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  pressed: { opacity: 0.7 },
  gateContent: { width: '100%', flexGrow: 1, alignSelf: 'center', paddingVertical: Spacing.xl, gap: Spacing.lg },
  gateIcon: { alignSelf: 'center', width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  gateTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  gateBody: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, textAlign: 'center' },
  upgradeButton: { minHeight: 48, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary },
  upgradeText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textOnPrimary },
});
