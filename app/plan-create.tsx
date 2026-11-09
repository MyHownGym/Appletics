// Powered by OnSpace.AI
// Plan create v3 — date range picker, phases en français, groupes avec labels,
// plan sans athlète obligatoire, vue calendrier mensuelle
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useApp } from '@/hooks/useApp';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useI18n } from '@/hooks/useI18n';
import { TrainingPlan } from '@/types';
import { EVENT_GROUPS } from '@/constants/config';
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';

// Phases en français
const PLAN_PHASES: { id: string; label: string; color: string }[] = [
  { id: 'Base',        label: 'Base',        color: '#60A5FA' },
  { id: 'Build',       label: 'Développement', color: '#FBBF24' },
  { id: 'Peak',        label: 'Pic de forme', color: '#F87171' },
  { id: 'Taper',       label: 'Affûtage',    color: '#A78BFA' },
  { id: 'Competition', label: 'Compétition', color: '#FFD700' },
  { id: 'Recovery',    label: 'Récupération', color: '#34D399' },
];

const WEEK_PRESETS = ['2', '4', '6', '8', '12'];

// Compute end date from start date + weeks
function addWeeks(dateStr: string, weeks: number): string {
  if (!dateStr) {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().split('T')[0];
  }
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

// Format date for display
function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function PlanCreateScreen() {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { addTrainingPlan, updateTrainingPlan, trainingPlans, athletes } = useApp();
  const { notifyNewPlan, notifyPlanUpdated } = usePushNotifications();
  const { showAlert } = useAlert();
  const { t, locale } = useI18n();
  const ensureQuota = useSubscriptionQuota();

  const existing = editId ? trainingPlans?.find((p: TrainingPlan) => p.id === editId) : null;
  const { screenPadding } = useResponsive();

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [phase, setPhase] = useState(existing?.phase || 'Base');
  const [group, setGroup] = useState(existing?.group || 'sprints');
  const [weeks, setWeeks] = useState('4');
  const [customWeeks, setCustomWeeks] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(existing?.athleteIds || []);

  // Date range
  const [startDate, setStartDate] = useState(existing?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existing?.endDate || '');
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  const effectiveWeeks = customWeeks.trim() ? customWeeks.trim() : weeks;
  const groupAthletes = athletes.filter((a: any) => a.group === group);

  const toggleAthlete = (id: string) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Auto-compute end date when start date or weeks change
  const handleStartDate = (d: string) => {
    setStartDate(d);
    setShowStartCal(false);
    if (!endDate) {
      setEndDate(addWeeks(d, parseInt(effectiveWeeks) || 4));
    }
  };

  const handleWeeksChange = (w: string) => {
    setWeeks(w);
    setCustomWeeks('');
    if (startDate) setEndDate(addWeeks(startDate, parseInt(w) || 4));
  };

  const handleCustomWeeksChange = (v: string) => {
    const digits = v.replace(/\D/g, '');
    setCustomWeeks(digits);
    if (digits && startDate) setEndDate(addWeeks(startDate, parseInt(digits) || 4));
    if (digits) setWeeks('');
  };

  const phaseConfig = PLAN_PHASES.find(p => p.id === phase) || PLAN_PHASES[0];

  const handleCreate = () => {
    if (!existing && !ensureQuota('trainingPlans', trainingPlans.length)) return;
    if (!title.trim()) {
      showAlert(t('error'), t('plan_title'));
      return;
    }
    const numWeeks = parseInt(effectiveWeeks) || 4;
    const computedEnd = endDate || addWeeks(startDate, numWeeks);


    if (existing && updateTrainingPlan) {
      updateTrainingPlan({
        ...existing,
        title: title.trim(),
        description: description.trim(),
        phase,
        group,
        athleteIds: selectedAthletes,
        startDate,
        endDate: computedEnd,
        weeks: numWeeks,
      });
      router.replace('/(tabs)/plans');
    } else {
      const newPlan: TrainingPlan = {
        id: `tp-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        phase,
        group,
        athleteIds: selectedAthletes,
        startDate,
        endDate: computedEnd,
        weeks: numWeeks,
        // Empty plan: the coach adds the sessions.
        sessions: [],
      };
      addTrainingPlan(newPlan);
      notifyNewPlan(newPlan.title, newPlan.id).catch(() => {});
      router.replace('/(tabs)/plans');
    }
  };

  // Compute week count from dates if both selected
  const weeksBetween = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 86400000)))
    : null;

  const EVENT_GROUPS_NO_ALL = EVENT_GROUPS.filter(g => g.id !== 'all');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{existing ? t('edit') : t('create_plan')}</Text>
          <Pressable onPress={handleCreate} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{existing ? t('save') : t('add')}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingHorizontal: screenPadding }]}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('plan_title')} *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="ex. Bloc pré-saison sprints"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('plan_description')}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="ex. Objectifs, contexte, focus de la période..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Phase — labels en français */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('phase')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {PLAN_PHASES.map(p => {
                const isSelected = phase === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPhase(p.id)}
                    style={[styles.chip, isSelected && { backgroundColor: p.color, borderColor: p.color }]}
                  >
                    <Text style={[styles.chipText, isSelected && { color: '#FFF' }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Event Group — afficher le label complet */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('group')}</Text>
            <View style={styles.groupGrid}>
              {EVENT_GROUPS_NO_ALL.map(g => {
                const isSelected = group === g.id;
                const groupLabel = t(g.labelKey);
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => { setGroup(g.id); setSelectedAthletes([]); }}
                    style={[
                      styles.groupChip,
                      isSelected && { backgroundColor: g.color + '20', borderColor: g.color },
                    ]}
                  >
                    <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                    <Text style={[styles.groupChipText, isSelected && { color: g.color, fontWeight: Typography.weightBold }]}>
                      {groupLabel}
                    </Text>
                    {isSelected ? <MaterialIcons name="check" size={14} color={g.color} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date de début */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('start_date')}</Text>
            <Pressable style={[styles.input, styles.dateBtn]} onPress={() => { setShowStartCal(v => !v); setShowEndCal(false); }}>
              <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
              <Text style={styles.dateText}>{startDate ? formatDate(startDate, locale) : 'Sélectionner...'}</Text>
              <MaterialIcons name={showStartCal ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
            </Pressable>
            {showStartCal ? (
              <MiniCalendar value={startDate} onChange={handleStartDate} />
            ) : null}
          </View>

          {/* Durée (semaines) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('weeks')}</Text>
            <View style={styles.weekRow}>
              {WEEK_PRESETS.map(w => (
                <Pressable
                  key={w}
                  onPress={() => handleWeeksChange(w)}
                  style={[
                    styles.weekChip,
                    weeks === w && !customWeeks && styles.weekChipSelected,
                  ]}
                >
                  <Text style={[
                    styles.weekChipText,
                    weeks === w && !customWeeks && styles.weekChipTextSelected,
                  ]}>{w} {t('sem.')}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customWeekRow}>
              <MaterialIcons name="edit" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.customWeekInput}
                value={customWeeks}
                onChangeText={handleCustomWeeksChange}
                keyboardType="number-pad"
                placeholder="Nombre personnalisé (ex. 3, 5, 10...)"
                placeholderTextColor={Colors.textMuted}
                maxLength={3}
              />
              {customWeeks ? <Text style={styles.customWeekUnit}>sem.</Text> : null}
            </View>
          </View>

          {/* Date de fin */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('end_date')}</Text>
            <Pressable style={[styles.input, styles.dateBtn]} onPress={() => { setShowEndCal(v => !v); setShowStartCal(false); }}>
              <MaterialIcons name="event" size={18} color={Colors.error} />
              <Text style={styles.dateText}>{endDate ? formatDate(endDate, locale) : 'Sélectionner...'}</Text>
              <MaterialIcons name={showEndCal ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
            </Pressable>
            {showEndCal ? (
              <MiniCalendar value={endDate} onChange={d => { setEndDate(d); setShowEndCal(false); }} />
            ) : null}
            {weeksBetween ? (
              <View style={styles.durationSummary}>
                <MaterialIcons name="schedule" size={14} color={Colors.primary} />
                <Text style={styles.durationSummaryText}>
                  {weeksBetween} semaine{weeksBetween > 1 ? 's' : ''} · du {formatDate(startDate, locale)} au {formatDate(endDate, locale)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Athletes — optionnel */}
          <View style={styles.field}>
            <View style={styles.athleteHeader}>
              <Text style={styles.label}>
                {t('all_athletes')} ({selectedAthletes.length}) — {t('optional')}
              </Text>
              {selectedAthletes.length > 0 ? (
                <Pressable onPress={() => setSelectedAthletes([])}>
                  <Text style={styles.clearText}>Effacer</Text>
                </Pressable>
              ) : null}
            </View>
            {groupAthletes.length === 0 ? (
              <View style={styles.noAthletesWrap}>
                <MaterialIcons name="group-off" size={22} color={Colors.textMuted} />
                <Text style={styles.noAthletes}>Aucun athlète dans ce groupe</Text>
              </View>
            ) : (
              groupAthletes.map((a: any) => {
                const isSelected = selectedAthletes.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => toggleAthlete(a.id)}
                    style={[styles.athleteRow, isSelected && styles.athleteRowSelected]}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
                    </View>
                    <View style={styles.athleteInfo}>
                      <Text verbatim style={styles.athleteName}>{a.name}</Text>
                      <Text style={styles.athleteEvents}>{a.events.join(' · ')}</Text>
                    </View>
                    {a.status === 'injured' ? (
                      <Text style={styles.injuredLabel}>{t('injured')}</Text>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: 8, backgroundColor: Colors.background, borderRadius: Radius.md },
  headerTitle: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  saveBtnText: { color: '#FFF', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120, paddingTop: Spacing.md },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 13, fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateText: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  groupChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupChipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  weekRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  weekChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    minWidth: 48, alignItems: 'center',
  },
  weekChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  weekChipText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  weekChipTextSelected: { color: '#FFF' },
  customWeekRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginBottom: 6,
  },
  customWeekInput: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  customWeekUnit: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.primary },
  durationSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.sm, padding: 8,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  durationSummaryText: { fontSize: Typography.fontSizeSM, color: Colors.primary, fontWeight: Typography.weightSemibold, flex: 1 },
  athleteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  clearText: { fontSize: Typography.fontSizeSM, color: Colors.error, fontWeight: Typography.weightSemibold },
  noAthletesWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: Spacing.md },
  noAthletes: { fontSize: Typography.fontSizeBase, color: Colors.textMuted, fontStyle: 'italic' },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.md,
  },
  athleteRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  athleteInfo: { flex: 1 },
  athleteName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  athleteEvents: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  injuredLabel: { fontSize: Typography.fontSizeXS, color: Colors.error, fontWeight: Typography.weightSemibold },
});
