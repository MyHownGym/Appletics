// Powered by OnSpace.AI
// Plans screen — Appletics design, PDF export, athlete/coach split
import React, { useState } from 'react';
import {
  View, FlatList, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { ScreenHeader, PlanCard } from '@/components';
import { EVENT_GROUPS } from '@/constants/config';
import { TranslationKey } from '@/constants/i18n';
import { exportTrainingPlan } from '@/services/pdfExportService';
import { useActivityScope } from '@/hooks/useActivityScope';
import { padGrid } from '@/services/gridLayout';

export default function PlansScreen() {
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { athletes, user } = useApp();
  // Sessions published for a whole group (no plan) are shown in the calendar, not as a plan.
  const { trainingPlans: allPlans } = useActivityScope();
  const trainingPlans = allPlans.filter(plan => !plan.groupSessions);
  const { t, language } = useI18n();
  const { hasFeature } = useSubscription();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const isAthlete = user.userType === 'athlete';
  const { screenPadding, cols, isPhone } = useResponsive();

  // A group shows its own plans, plans for everyone, and plans assigned to one of its athletes.
  const filteredPlans = selectedGroup === 'all'
    ? trainingPlans
    : trainingPlans.filter(p => p.group === selectedGroup || p.group === 'all'
      || p.athleteIds.some(id => athletes.find(a => a.id === id)?.group === selectedGroup));

  const handleExportPDF = async (planId: string) => {
    if (!hasFeature('pdf_export')) {
      router.push({ pathname: '/upgrade', params: { tier: user.accountType === 'club' ? 'club_pro' : 'elite', reason: 'Export PDF requiert une formule compatible' } } as any);
      return;
    }
    const plan = trainingPlans.find(p => p.id === planId);
    if (!plan) return;
    setExportingId(planId);
    try {
      await exportTrainingPlan(plan, athletes, language);
    } catch (e) {
      showAlert('Erreur', "Impossible de générer le PDF. Vérifiez les permissions.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        // The whole screen scrolls (title, filters and list together).
        ListHeaderComponent={<View style={{ marginHorizontal: -Spacing.screenPadding }}>
            <ScreenHeader
              title={t('training_plans')}
              subtitle={`${trainingPlans.length} ${t('active_plans')}`}
              rightAction={!isAthlete ? { icon: 'add', label: t('add_plan'), onPress: () => router.push('/plan-create') } : undefined}
            />

            {/* Group filter */}
            <View style={styles.filterWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                {EVENT_GROUPS.map(g => {
                  const isSelected = selectedGroup === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setSelectedGroup(g.id)}
                      style={[
                        styles.filterChip,
                        isSelected
                          ? { backgroundColor: g.color, borderColor: g.color }
                          : { backgroundColor: Colors.surface, borderColor: Colors.border },
                      ]}
                    >
                      {isSelected ? <View style={styles.filterDot} /> : null}
                      <Text style={[styles.filterLabel, { color: isSelected ? '#FFF' : Colors.textSecondary }]}>
                        {t(('group_' + g.id) as TranslationKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
        </View>}
        data={padGrid(filteredPlans, isPhone ? 1 : cols)}
        keyExtractor={item => item.id}
        numColumns={isPhone ? 1 : cols}
        key={isPhone ? 'phone' : `cols-${cols}`}
        contentContainerStyle={[styles.list, { paddingHorizontal: Spacing.screenPadding }]}
        columnWrapperStyle={!isPhone && cols > 1 ? { gap: Spacing.md } : undefined}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: cell }) => 'pad' in cell ? <View style={{ flex: 1, minWidth: 1 }} /> : ((item: typeof filteredPlans[number]) => (
          <View style={{ flex: 1, minWidth: 1 }}>
            <PlanCard
              fill
              plan={item}
              onPress={() => router.push({ pathname: '/plan-detail', params: { id: item.id } })}
            />
            {/* PDF export row */}
            {!isAthlete ? (
              <Pressable
                style={({ pressed }) => [styles.exportRow, pressed && { opacity: 0.7 }]}
                onPress={() => handleExportPDF(item.id)}
              >
                {hasFeature('pdf_export') ? (
                  <>
                    <MaterialIcons name="picture-as-pdf" size={14} color={Colors.error} />
                    <Text style={styles.exportText}>
                      {exportingId === item.id ? 'Génération PDF...' : 'Exporter en PDF'}
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
              <MaterialIcons name="event-note" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_plans')}</Text>
            {!isAthlete ? (
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/plan-create')}>
                <MaterialIcons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>{t('add_plan')}</Text>
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
  filterWrap: { height: 52 },
  filterContent: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, height: 36,
  },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF60' },
  filterLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold },
  list: { paddingTop: Spacing.md, paddingBottom: 120 },
  exportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8, marginTop: -6, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md,
    borderTopWidth: 0,
  },
  exportText: { fontSize: Typography.fontSizeXS, color: Colors.error, fontWeight: Typography.weightSemibold },
  empty: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
