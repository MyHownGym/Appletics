// Powered by OnSpace.AI
// Competitions screen — Appletics design, PDF export, Swiss Athletics
import React, { useState } from 'react';
import {
  View, FlatList, Pressable, StyleSheet, Linking,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/hooks/useApp';
import { useResponsive } from '@/hooks/useResponsive';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { ScreenHeader, CompetitionCard } from '@/components';
import { exportCompetitionResults } from '@/services/pdfExportService';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useActivityScope } from '@/hooks/useActivityScope';
import { padGrid } from '@/services/gridLayout';

const STATUS_IDS = ['all', 'upcoming', 'completed'];

export default function CompetitionsScreen() {
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { athletes, user } = useApp();
  const { competitions, results } = useActivityScope();
  const { openLink } = useExternalLinks();
  const { t, language } = useI18n();
  const { hasFeature } = useSubscription();
  const [status, setStatus] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const isAthlete = user.userType === 'athlete';
  const { screenPadding, cols, isPhone } = useResponsive();

  const statusLabels: Record<string, string> = {
    all: t('all'), upcoming: t('upcoming'), completed: t('meets_done'),
  };
  const sorted = [...competitions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = status === 'all' ? sorted : sorted.filter(c => c.status === status);
  const totalPBs = results.filter(r => r.pb).length;
  const wins = results.filter(r => r.rank === 1).length;

  const handleExportPDF = async (compId: string) => {
    if (!hasFeature('pdf_export')) {
      router.push({ pathname: '/upgrade', params: { tier: user.accountType === 'club' ? 'club_pro' : 'elite', reason: 'Export PDF requiert une formule compatible' } } as any);
      return;
    }
    const comp = competitions.find(c => c.id === compId);
    if (!comp) return;
    setExportingId(compId);
    try {
      await exportCompetitionResults(comp, results, athletes, language);
    } catch (e) {
      showAlert('Erreur', 'Impossible de générer le PDF.');
    } finally {
      setExportingId(null);
    }
  };

  const openSwissAthletics = () => {
    void openLink('https://www.swiss-athletics.ch/fr/competitions/resultats/live-results/');
  };

  const openInscriptions = () => {
    void openLink('https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        // The whole screen scrolls (title, filters and list together).
        ListHeaderComponent={<View style={{ marginHorizontal: -Spacing.screenPadding }}>
            <ScreenHeader
              title={t('competitions')}
              subtitle={`${competitions.length} ${t('competitions').toLowerCase()} · ${totalPBs} PBs`}
              rightAction={!isAthlete ? { icon: 'add', label: t('add_competition'), onPress: () => router.push('/competition-create') } : undefined}
            />

            {/* Season summary */}
            <LinearGradient colors={['#FF7A4D', '#FF5722', '#D93C10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.summaryStrip, Shadow.card]}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{wins}</Text>
                <Text style={styles.summaryLabel}>{t('event_wins')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{totalPBs}</Text>
                <Text style={styles.summaryLabel}>{t('pbs_set')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{competitions.filter(c => c.status === 'completed').length}</Text>
                <Text style={styles.summaryLabel}>{t('meets_done')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{competitions.filter(c => c.status === 'upcoming').length}</Text>
                <Text style={styles.summaryLabel}>{t('upcoming')}</Text>
              </View>
            </LinearGradient>

            {/* Status filter */}
            <View style={styles.tabRow}>
              {STATUS_IDS.map(id => {
                const isActive = status === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setStatus(id)}
                    style={[styles.tab, isActive && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  >
                    <Text style={[styles.tabLabel, isActive && { color: '#FFF' }]}>{statusLabels[id]}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Swiss Athletics links */}
            <View style={styles.swissRow}>
              {[
                { title: 'Résultats', sub: 'Swiss Athletics', color: Colors.info, onPress: openSwissAthletics },
                { title: 'Inscriptions', sub: 'Swiss Athletics', color: Colors.primary, onPress: openInscriptions },
              ].map(link => (
                <Pressable key={link.title} accessibilityRole="link" onPress={link.onPress}
                  style={({ pressed }) => [styles.swissBtn, !isPhone && styles.swissBtnWide, pressed && { opacity: 0.8 }]}>
                  <View style={[styles.swissFlagTile, !isPhone && styles.swissFlagTileWide, { backgroundColor: link.color + '14' }]}><Text style={[styles.swissFlag, !isPhone && { fontSize: 24 }]}>🇨🇭</Text></View>
                  <View style={{ flex: 1, minWidth: 1 }}>
                    <Text style={[styles.swissBtnTitle, !isPhone && styles.swissBtnTitleWide]} numberOfLines={1}>{link.title}</Text>
                    <Text style={[styles.swissBtnSub, !isPhone && styles.swissBtnSubWide]} numberOfLines={1}>{link.sub}</Text>
                  </View>
                  <View style={[styles.swissArrow, { backgroundColor: link.color + '14' }]}><MaterialIcons name="open-in-new" size={!isPhone ? 18 : 14} color={link.color} /></View>
                </Pressable>
              ))}
            </View>
        </View>}
        data={padGrid(filtered, isPhone ? 1 : cols)}
        keyExtractor={item => item.id}
        numColumns={isPhone ? 1 : cols}
        key={isPhone ? 'phone' : `cols-${cols}`}
        contentContainerStyle={[styles.list, { paddingHorizontal: Spacing.screenPadding }]}
        columnWrapperStyle={!isPhone && cols > 1 ? { gap: Spacing.md } : undefined}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: cell }) => 'pad' in cell ? <View style={{ flex: 1, minWidth: 1 }} /> : ((item: typeof filtered[number]) => (
          <View style={{ flex: 1, minWidth: 1 }}>
            <CompetitionCard
              fill
              competition={item}
              onPress={() => router.push({ pathname: '/competition-detail', params: { id: item.id } })}
            />
            {/* PDF export for completed */}
            {!isAthlete ? (
              <Pressable
                style={({ pressed }) => [styles.exportRow, pressed && { opacity: 0.7 }]}
                onPress={() => handleExportPDF(item.id)}
              >
                {hasFeature('pdf_export') ? (
                  <>
                    <MaterialIcons name="picture-as-pdf" size={14} color={Colors.error} />
                    <Text style={styles.exportText}>
                      {exportingId === item.id ? 'Génération...' : 'Exporter résultats PDF'}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="lock" size={14} color={Colors.textMuted} />
                    <Text style={[styles.exportText, { color: Colors.textMuted }]}>Export PDF — {user.accountType === 'club' ? 'Club Pro' : 'Elite'}</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
        ))(cell)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="emoji-events" size={36} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>{t('no_meets_found')}</Text>
            {!isAthlete ? (
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/competition-create')}>
                <MaterialIcons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>{t('add_competition')}</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  summaryStrip: {
    flexDirection: 'row', overflow: 'hidden',
    marginHorizontal: Spacing.screenPadding as any, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: '#FFFFFF' },
  summaryLabel: { fontSize: Typography.fontSizeXS, color: 'rgba(255,255,255,0.88)', fontWeight: Typography.weightSemibold, marginTop: 2, textAlign: 'center' },
  completedLabel: { color: Colors.success, fontWeight: Typography.weightSemibold },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, gap: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  tabLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  swissRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  swissBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  swissFlag: { fontSize: 16 },
  swissBtnWide: { padding: Spacing.md, gap: Spacing.md, borderRadius: Radius.lg, minHeight: 84 },
  swissFlagTile: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  swissFlagTileWide: { width: 52, height: 52, borderRadius: 14 },
  swissBtnTitleWide: { fontSize: Typography.fontSizeMD },
  swissBtnSubWide: { fontSize: Typography.fontSizeSM, marginTop: 2 },
  swissArrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  swissBtnTitle: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  swissBtnSub: { fontSize: 10, color: Colors.textMuted },
  list: { paddingBottom: 120 },
  exportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8, marginTop: -6, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md, borderTopWidth: 0,
  },
  exportText: { fontSize: Typography.fontSizeXS, color: Colors.error, fontWeight: Typography.weightSemibold },
  empty: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#F59E0B12', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
