// Powered by OnSpace.AI
// session-edit v3 — coach edits full session, athlete sees read-only + logs performance
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { weekdayLabel } from '@/services/localizationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { TrainingSession, SessionPerformance, SessionMetric } from '@/types';
import { INTENSITY_LEVELS, getIntensityColor } from '@/constants/config';
import { IntensityDot } from '@/components/ui/IntensityDot';
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { SessionSharingPanel } from '@/components/feature/SessionSharingPanel';
import { useActivityScope } from '@/hooks/useActivityScope';

const SESSION_TYPES = [
  { id: 'track', icon: 'directions-run', label: 'Piste' },
  { id: 'gym',   icon: 'fitness-center', label: 'Gym' },
  { id: 'road',  icon: 'terrain',        label: 'Route' },
  { id: 'pool',  icon: 'pool',           label: 'Piscine' },
  { id: 'rest',  icon: 'hotel',          label: 'Repos' },
  { id: 'other', icon: 'sports',         label: 'Autre' },
] as const;

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function dayFromDate(dateStr: string): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

function formatDateFr(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return dateStr; }
}

// ── Performance Log Modal (for athletes) ──────────────────────────────────
function PerfLogModal({ visible, onClose, onSave, existingPerf }: {
  visible: boolean;
  onClose: () => void;
  onSave: (metrics: SessionMetric[], notes: string) => void;
  existingPerf?: SessionPerformance | null;
}) {
  const [metrics, setMetrics] = useState<SessionMetric[]>(
    existingPerf?.metrics || [{ label: '', value: '', unit: 's' }]
  );
  const [notes, setNotes] = useState(existingPerf?.notes || '');

  const UNIT_OPTIONS = ['s', 'm', 'cm', 'kg', 'reps', 'min', '%'];

  const addMetric = () => setMetrics(prev => [...prev, { label: '', value: '', unit: 's' }]);
  const removeMetric = (i: number) => setMetrics(prev => prev.filter((_, idx) => idx !== i));
  const updateMetric = (i: number, field: keyof SessionMetric, value: string) => {
    setMetrics(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const isValid = metrics.some(m => m.label.trim() && m.value.trim());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={perfStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={perfStyles.sheet}>
          <View style={perfStyles.handle} />
          <View style={perfStyles.header}>
            <MaterialIcons name="fitness-center" size={20} color={Colors.primary} />
            <Text style={perfStyles.title}>Saisir mes performances</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={perfStyles.subtitle}>Entrez vos temps, distances ou autres mesures de la séance.</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" style={{ height: 360, flexShrink: 1 }}>
            {metrics.map((m, i) => (
              <View key={i} style={perfStyles.metricRow}>
                <View style={perfStyles.metricFields}>
                  <TextInput
                    style={[perfStyles.metricInput, { flex: 2 }]}
                    value={m.label}
                    onChangeText={v => updateMetric(i, 'label', v)}
                    placeholder="Ex: 100m, Squat, Saut..."
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TextInput
                    style={[perfStyles.metricInput, { flex: 1.5 }]}
                    value={m.value}
                    onChangeText={v => updateMetric(i, 'value', v)}
                    placeholder="10.85"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {UNIT_OPTIONS.map(u => (
                        <Pressable
                          key={u}
                          style={[perfStyles.unitBtn, m.unit === u && perfStyles.unitBtnActive]}
                          onPress={() => updateMetric(i, 'unit', u)}
                        >
                          <Text style={[perfStyles.unitText, m.unit === u && { color: '#FFF' }]}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {metrics.length > 1 ? (
                  <Pressable onPress={() => removeMetric(i)} hitSlop={8} style={perfStyles.removeBtn}>
                    <MaterialIcons name="remove-circle-outline" size={20} color={Colors.error} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Pressable style={perfStyles.addMetricBtn} onPress={addMetric}>
              <MaterialIcons name="add" size={16} color={Colors.primary} />
              <Text style={perfStyles.addMetricText}>Ajouter une mesure</Text>
            </Pressable>
            <View style={perfStyles.notesField}>
              <Text style={perfStyles.notesLabel}>Notes / Ressenti</Text>
              <TextInput
                style={perfStyles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex. Bonnes sensations, léger vent favorable..."
                placeholderTextColor={Colors.textMuted}
                multiline numberOfLines={3}
              />
            </View>
          </ScrollView>

          <Pressable
            style={[perfStyles.saveBtn, !isValid && { opacity: 0.4 }]}
            onPress={() => { if (isValid) { onSave(metrics, notes); onClose(); } }}
            disabled={!isValid}
          >
            <MaterialIcons name="check" size={18} color="#FFF" />
            <Text style={perfStyles.saveBtnText}>Enregistrer mes performances</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const perfStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.sm, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 20 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  metricFields: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  metricInput: { backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 10, fontSize: Typography.fontSizeSM, color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.border },
  unitBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  unitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitText: { fontSize: 10, fontWeight: Typography.weightBold, color: Colors.textSecondary },
  removeBtn: { padding: 4 },
  addMetricBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.primary + '10', borderWidth: 1, borderColor: Colors.primary + '30', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  addMetricText: { fontSize: Typography.fontSizeSM, color: Colors.primary, fontWeight: Typography.weightSemibold },
  notesField: { marginBottom: Spacing.md },
  notesLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 6 },
  notesInput: { backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.fontSizeSM, color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.border, height: 80, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14 },
  saveBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});

// ── ATHLETE READ-ONLY VIEW ────────────────────────────────────────────────
function AthleteSessionView({ session, planId }: { session: TrainingSession; planId: string }) {
  const { user, athletes, sessionPerformances, addSessionPerformance, deleteSessionPerformance } = useApp();
  const { hasFeature } = useSubscription();
  const { t, locale, language } = useI18n();
  const router = useRouter();
  const [showPerfModal, setShowPerfModal] = useState(false);

  const { athlete: athleteRecord } = useActivityScope();
  const existingPerf = sessionPerformances.find(
    p => p.sessionId === session.id && p.athleteId === athleteRecord?.id
  );

  const intensityConfig = INTENSITY_LEVELS.find(l => l.id === session.intensity);
  const typeConfig = SESSION_TYPES.find(t => t.id === session.type);
  const intensityColor = getIntensityColor(session.intensity);

  const handleSavePerf = (metrics: SessionMetric[], notes: string) => {
    if (!athleteRecord) return;
    const perf: SessionPerformance = {
      id: `perf-${Date.now()}`,
      sessionId: session.id,
      planId,
      athleteId: athleteRecord.id,
      athleteName: athleteRecord.name,
      date: new Date().toISOString().split('T')[0],
      metrics,
      notes,
    };
    addSessionPerformance(perf);
  };

  const canLogPerf = hasFeature('performance_charts') || true; // free for athletes

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text verbatim style={styles.headerTitle}>{session.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Session card */}
        <View style={[styles.detailCard, { borderLeftColor: intensityColor }]}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: intensityColor + '15' }]}>
              <MaterialIcons name={typeConfig?.icon as any || 'directions-run'} size={22} color={intensityColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text verbatim style={styles.detailTitle}>{session.title}</Text>
              <View style={styles.detailMeta}>
                <View style={[styles.intensityBadge, { backgroundColor: intensityColor + '18', borderColor: intensityColor + '50' }]}>
                  <IntensityDot intensity={session.intensity} size={8} />
                  <Text style={[styles.intensityText, { color: intensityColor }]}>{intensityConfig ? t(intensityConfig.labelKey) : session.intensity}</Text>
                </View>
                <Text style={styles.detailDuration}>{session.duration > 0 ? `${session.duration} min` : 'Repos'}</Text>
                {session.sessionDate ? (
                  <Text style={styles.detailDate}>{formatDateFr(session.sessionDate, locale)}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Details / consignes du coach */}
        {session.details ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="assignment" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Consignes du coach</Text>
            </View>
            <View style={styles.instructionsCard}>
              <Text verbatim style={styles.instructionsText}>{session.details}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyInstructions}>
              <MaterialIcons name="assignment-late" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyInstructionsText}>Aucune consigne pour cette séance</Text>
            </View>
          </View>
        )}

        {/* Performance logging */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="speed" size={16} color={Colors.info} />
            <Text style={styles.sectionTitle}>Mes performances</Text>
          </View>

          <Text style={styles.noPerfSub}>Local uniquement</Text>
          <Text style={styles.noPerfSub}>Ces données restent sur cet appareil tant que vous ne les partagez pas.</Text>
          {existingPerf ? (
            <View style={[styles.perfCard, Shadow.card]}>
              <View style={styles.perfCardHeader}>
                <View style={styles.perfCardTitle}>
                  <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                  <Text style={styles.perfCardTitleText}>Enregistré le {existingPerf.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => setShowPerfModal(true)} hitSlop={8}>
                    <MaterialIcons name="edit" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => deleteSessionPerformance(existingPerf.id)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              {existingPerf.metrics.filter(m => m.label && m.value).map((m, i) => (
                <View key={i} style={styles.metricDisplay}>
                  <Text verbatim style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.value} <Text style={styles.metricUnit}>{m.unit}</Text></Text>
                </View>
              ))}
              {existingPerf.notes ? (
                <Text verbatim style={styles.perfNotes}>{existingPerf.notes}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.noPerfCard}>
              <MaterialIcons name="timer" size={28} color={Colors.textMuted} />
              <Text style={styles.noPerfText}>Pas encore de performance enregistrée</Text>
              <Text style={styles.noPerfSub}>Saisissez vos temps, distances ou mesures après la séance</Text>
            </View>
          )}

          <Pressable
            style={[styles.logPerfBtn, existingPerf && { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '40' }]}
            disabled={!athleteRecord}
            onPress={() => setShowPerfModal(true)}
          >
            <MaterialIcons name={existingPerf ? 'edit' : 'add'} size={18} color={existingPerf ? Colors.primary : '#FFF'} />
            <Text style={[styles.logPerfBtnText, existingPerf && { color: Colors.primary }]}>
              {existingPerf ? 'Modifier mes performances' : 'Saisir mes performances'}
            </Text>
          </Pressable>
        </View>
        <SessionSharingPanel planId={planId} session={session} localPerformance={existingPerf} />
      </ScrollView>

      <PerfLogModal
        key={`${existingPerf?.id ?? 'new'}:${showPerfModal ? 'open' : 'closed'}`}
        visible={showPerfModal}
        onClose={() => setShowPerfModal(false)}
        onSave={handleSavePerf}
        existingPerf={existingPerf}
      />
    </SafeAreaView>
  );
}

// ── COACH EDIT VIEW ───────────────────────────────────────────────────────
export default function SessionEditScreen() {
  const router = useRouter();
  const { planId, sessionId } = useLocalSearchParams<{ planId: string; sessionId?: string }>();
  const { trainingPlans, addSession, updateSession, deleteSession, user } = useApp();
  const { t, locale, language } = useI18n();

  const plan = trainingPlans.find(p => p.id === planId);
  const existing = sessionId ? plan?.sessions.find(s => s.id === sessionId) : null;
  const isAthlete = user.userType === 'athlete';

  const isEditing = Boolean(existing);
  const defaultDate = existing?.sessionDate || todayIso();

  const [sessionDate, setSessionDate] = useState(defaultDate);
  const [showCal, setShowCal] = useState(false);
  const [title, setTitle] = useState(existing?.title || '');
  const [type, setType] = useState<TrainingSession['type']>(existing?.type || 'track');
  const [intensity, setIntensity] = useState<TrainingSession['intensity']>(existing?.intensity || 'moderate');
  const [duration, setDuration] = useState(String(existing?.duration ?? 60));
  const [details, setDetails] = useState(existing?.details || '');

  const handleSave = () => {
    if (!title.trim() || !planId) return;
    const session: TrainingSession = {
      id: sessionId || `s-${Date.now()}`,
      day: dayFromDate(sessionDate),
      sessionDate,
      title: title.trim(),
      type,
      intensity,
      duration: parseInt(duration) || 0,
      details: details.trim(),
    };
    if (isEditing) {
      updateSession(planId, session);
    } else {
      addSession(planId, session);
    }
    router.back();
  };

  const handleDelete = () => {
    if (sessionId && planId) {
      deleteSession(planId, sessionId);
      router.back();
    }
  };

  const intensityConfig = INTENSITY_LEVELS.find(l => l.id === intensity);

  // Keep hooks unconditional when switching between coach and athlete views.
  if (isAthlete && existing) {
    return <AthleteSessionView session={existing} planId={planId} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Modifier' : 'Ajouter'} une séance
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isEditing ? (
              <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, !title.trim() && { opacity: 0.4 }]}
              disabled={!title.trim()}
            >
              <Text style={styles.saveBtnText}>{t('save')}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Date de la séance */}
          <View style={styles.field}>
            <Text style={styles.label}>Date de la séance</Text>
            <Pressable style={[styles.input, styles.dateBtn]} onPress={() => setShowCal(v => !v)}>
              <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.datePrimary}>{formatDateFr(sessionDate, locale)}</Text>
                <Text style={styles.dateSub}>Jour : {weekdayLabel(dayFromDate(sessionDate), language)}</Text>
              </View>
              <MaterialIcons name={showCal ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
            </Pressable>
            {showCal ? (
              <MiniCalendar value={sessionDate} onChange={d => { setSessionDate(d); setShowCal(false); }} />
            ) : null}
          </View>

          {/* Titre */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la séance *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="ex. Vitesse, Circuit Gym, Repos actif..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {SESSION_TYPES.map(st => (
                <Pressable
                  key={st.id}
                  onPress={() => setType(st.id)}
                  style={[styles.chip, type === st.id && styles.chipActive]}
                >
                  <MaterialIcons name={st.icon as any} size={14} color={type === st.id ? '#FFF' : Colors.textSecondary} />
                  <Text style={[styles.chipText, type === st.id && { color: '#FFF' }]}>{st.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intensité */}
          <View style={styles.field}>
            <Text style={styles.label}>Intensité</Text>
            <View style={styles.chipRow}>
              {INTENSITY_LEVELS.map(il => {
                const isSelected = intensity === il.id;
                return (
                  <Pressable
                    key={il.id}
                    onPress={() => setIntensity(il.id as TrainingSession['intensity'])}
                    accessibilityRole="button"
                    accessibilityLabel={t(il.labelKey)}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.chip,
                      isSelected
                        ? { backgroundColor: il.color + '18', borderColor: il.color }
                        : { backgroundColor: Colors.surface, borderColor: Colors.border },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <IntensityDot intensity={il.id} size={8} />
                    <Text style={[styles.chipText, isSelected && styles.intensityChipTextSelected]}>
                      {t(il.labelKey)}
                    </Text>
                    {isSelected ? <MaterialIcons name="check" size={14} color={Colors.textPrimary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Durée */}
          <View style={styles.field}>
            <Text style={styles.label}>Durée (min)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Détails */}
          <View style={styles.field}>
            <Text style={styles.label}>Détails / Consignes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={details}
              onChangeText={setDetails}
              placeholder="ex. 4x200m @95%, récup 8min, exercices de départ..."
              placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={4}
            />
          </View>

          {existing ? <SessionSharingPanel planId={planId} session={existing} /> : null}

          {/* Summary */}
          <View style={[styles.summaryCard, { borderColor: (intensityConfig?.color || Colors.border) + '60' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: (intensityConfig?.color || Colors.primary) + '18' }]}>
              <MaterialIcons
                name={SESSION_TYPES.find(st => st.id === type)?.icon as any || 'directions-run'}
                size={20}
                color={intensityConfig?.color || Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{title || 'Nom de la séance'}</Text>
              <Text style={styles.summarySub}>
                {formatDateFr(sessionDate, locale)} · {duration || '0'}min · {intensityConfig ? t(intensityConfig.labelKey) : intensity}
              </Text>
            </View>
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
  headerTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  saveBtnText: { color: '#FFF', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  deleteBtn: { padding: 8, backgroundColor: Colors.error + '12', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error + '30' },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 120 },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 13, fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  datePrimary: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Typography.weightSemibold, textTransform: 'capitalize' },
  dateSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  textarea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, minHeight: 48, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  intensityChipTextSelected: { color: Colors.textPrimary, fontWeight: Typography.weightBold },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, marginTop: Spacing.sm,
  },
  summaryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  summarySub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 3, textTransform: 'capitalize' },

  // Athlete read-only view
  detailCard: {
    margin: Spacing.screenPadding, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 5, ...Shadow.card,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  detailIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, marginBottom: 8 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  intensityBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  intensityText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  detailDuration: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  detailDate: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textTransform: 'capitalize' },
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  instructionsCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  instructionsText: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 24 },
  emptyInstructions: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyInstructionsText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, flex: 1 },
  perfCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '40', marginBottom: Spacing.md },
  perfCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  perfCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perfCardTitleText: { fontSize: Typography.fontSizeSM, color: Colors.success, fontWeight: Typography.weightSemibold },
  metricDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  metricLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, flex: 1 },
  metricValue: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold, color: Colors.primary },
  metricUnit: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightMedium, color: Colors.textMuted },
  perfNotes: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
  noPerfCard: { alignItems: 'center', gap: 8, paddingVertical: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: Spacing.md },
  noPerfText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  noPerfSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 18 },
  logPerfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 13, borderWidth: 1, borderColor: Colors.primary },
  logPerfBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
