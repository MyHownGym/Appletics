// Powered by OnSpace.AI
// v4 - Date début + date fin, lieu, statut, épreuves, athlètes
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Linking, Switch,
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
import { Competition } from '@/types';
import { MEET_TYPES, TRACK_EVENTS } from '@/constants/config';
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { useCompetitionSchedule } from '@/hooks/useCompetitionSchedule';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function CompetitionCreateScreen() {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { openLink } = useExternalLinks();
  const { addCompetition, updateCompetition, deleteCompetition, competitions, athletes } = useApp();
  const { notifyNewCompetition, scheduleCompetitionReminder } = usePushNotifications();
  const { showAlert } = useAlert();
  const { t, locale } = useI18n();
  const ensureQuota = useSubscriptionQuota();

  const existing = editId ? competitions.find((c: any) => c.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [venue, setVenue] = useState(existing?.venue || '');
  const [date, setDate] = useState(existing?.date || '');
  const [endDate, setEndDate] = useState((existing as any)?.endDate || '');
  const [type, setType] = useState(existing?.type || 'Outdoor');
  const [cancelled, setCancelled] = useState(existing?.status === 'cancelled');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(existing?.athleteIds || []);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(existing?.events || []);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  const isEditing = Boolean(existing);
  const isMultiDay = date && endDate && date !== endDate;
  const { screenPadding, maxContentWidth } = useResponsive();
  const { status, dateError } = useCompetitionSchedule(date, endDate, cancelled);

  const toggleAthlete = (id: string) =>
    setSelectedAthletes(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const toggleEvent = (event: string) =>
    setSelectedEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);

  const handleSave = () => {
    if (!existing && !ensureQuota('competitions', competitions.length)) return;
    if (!name.trim()) { showAlert(t('error'), t('plan_title')); return; }
    if (!date) { showAlert(t('error'), t('start_date')); return; }
    if (dateError) { showAlert(t('error'), dateError); return; }
    if (selectedEvents.length === 0) { showAlert(t('error'), 'Choisissez au moins une discipline.'); return; }

    const payload = {
      name: name.trim(), type, date, endDate: endDate || date,
      venue: venue.trim() || 'TBC', location: venue.trim() || 'TBC',
      status, events: selectedEvents, athleteIds: selectedAthletes,
    };

    if (isEditing && existing) {
      updateCompetition({ ...existing, ...payload });
      showAlert(t('success'), `"${name.trim()}" ${t('save')}`, [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      const newComp: Competition = {
        id: `c-${Date.now()}`,
        ...payload,
      };
      addCompetition(newComp);
      if (newComp.status === 'upcoming') notifyNewCompetition(newComp.name, newComp.date, newComp.id).catch(() => {});
      if (newComp.status === 'upcoming' && newComp.date) {
        const compDate = new Date(newComp.date + 'T09:00:00');
        scheduleCompetitionReminder(newComp.name, compDate, newComp.id).catch(() => {});
      }
      router.replace('/(tabs)/competitions');
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    showAlert(t('delete'), `${t('delete')} "${existing.name}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: () => {
          deleteCompetition(existing.id);
          router.back();
        },
      },
    ]);
  };

  const openInMaps = () => {
    if (!venue.trim()) return;
    const query = encodeURIComponent(venue.trim());
    void openLink(`https://maps.google.com/?q=${query}`);
  };

  const statusColor = status === 'cancelled' ? Colors.error : status === 'completed' ? Colors.success : Colors.primary;
  const statusLabel = status === 'completed' ? 'Terminée' : status === 'cancelled' ? t('cancelled') : t('upcoming');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? t('edit') : t('add_meet')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isEditing ? (
              <Pressable onPress={handleDelete} style={styles.deleteBtnHeader} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
              </Pressable>
            ) : null}
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{isEditing ? t('save') : t('add')}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingHorizontal: screenPadding, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]}>

          {/* Nom */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la compétition *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="ex. Championnats Régionaux" placeholderTextColor={Colors.textMuted} />
          </View>

          {/* Date de début */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('start_date')} *</Text>
            <Pressable
              style={[styles.input, styles.dateBtn]}
              onPress={() => { setShowStartCal(v => !v); setShowEndCal(false); }}
            >
              <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
              <Text style={[styles.dateText, !date && { color: Colors.textMuted }]}>
                {date ? formatDate(date, locale) : 'Sélectionner une date...'}
              </Text>
              <MaterialIcons name={showStartCal ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
            </Pressable>
            {showStartCal ? (
              <MiniCalendar
                value={date}
                onChange={d => { setDate(d); setShowStartCal(false); }}
              />
            ) : null}
          </View>

          {/* Date de fin */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('end_date')} <Text style={styles.optionalLabel}>({t('optional')})</Text></Text>
            <Pressable
              style={[styles.input, styles.dateBtn]}
              onPress={() => { setShowEndCal(v => !v); setShowStartCal(false); }}
            >
              <MaterialIcons name="event" size={18} color={Colors.error} />
              <Text style={[styles.dateText, !endDate && { color: Colors.textMuted }]}>
                {endDate ? formatDate(endDate, locale) : 'Compétition sur plusieurs jours...'}
              </Text>
              {endDate ? (
                <Pressable onPress={() => setEndDate('')} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </Pressable>
              ) : (
                <MaterialIcons name={showEndCal ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
              )}
            </Pressable>
            {showEndCal ? (
              <MiniCalendar
                value={endDate || date}
                onChange={d => { setEndDate(d); setShowEndCal(false); }}
              />
            ) : null}
            {isMultiDay ? (
              <View style={styles.multiDayBadge}>
                <MaterialIcons name="date-range" size={14} color={Colors.info} />
                <Text style={styles.multiDayText}>
                  Compétition sur plusieurs jours · {formatDate(date, locale)} → {formatDate(endDate, locale)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Lieu */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('venue')}</Text>
            <View style={styles.venueRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={venue}
                onChangeText={setVenue}
                placeholder="ex. Stade Olympique de Lausanne"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable
                style={[styles.mapBtn, !venue.trim() && styles.mapBtnDisabled]}
                onPress={openInMaps}
                disabled={!venue.trim()}
                hitSlop={4}
              >
                <MaterialIcons name="place" size={20} color={!venue.trim() ? Colors.textMuted : '#1A73E8'} />
              </Pressable>
            </View>
          </View>

          {/* Date-derived status; only cancellation can be set manually. */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('status_label')} · automatique</Text>
            <View style={[styles.automaticStatus, { backgroundColor: statusColor + '10', borderColor: statusColor + '30' }]}>
              <MaterialIcons name={status === 'completed' ? 'check-circle-outline' : status === 'cancelled' ? 'cancel' : 'event'} size={22} color={statusColor} />
              <Text accessibilityLiveRegion="polite" style={[styles.automaticStatusText, { color: statusColor }]}>{date ? statusLabel : 'Choisissez une date'}</Text>
            </View>
            <Text style={styles.statusHint}>La compétition passe automatiquement à « Terminée » le lendemain de sa date de fin, ou de sa date de début si aucune fin n’est indiquée.</Text>
            {dateError ? <View style={styles.dateError}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text style={[styles.statusHint, { color: Colors.error }]}>{dateError}</Text></View> : null}
            <View style={styles.cancellationRow}><Text style={styles.cancellationLabel}>Compétition annulée</Text><Switch accessibilityLabel="Marquer la compétition comme annulée" value={cancelled} onValueChange={setCancelled} trackColor={{ false: Colors.border, true: Colors.error }} thumbColor={Colors.surface} /></View>
          </View>

          {/* Type de compétition */}
          <View style={styles.field}>
            <Text style={styles.label}>Type de compétition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {MEET_TYPES.map(mt => (
                <Pressable key={mt} onPress={() => setType(mt)} style={[styles.chip, type === mt && styles.chipActive]}>
                  <Text style={[styles.chipText, type === mt && styles.chipTextActive]}>{mt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Épreuves */}
          <View style={styles.field}>
            <Text style={styles.label}>{`Disciplines (${selectedEvents.length}) *`}</Text>
            <View style={styles.eventsGrid}>
              {TRACK_EVENTS.map(event => {
                const isSelected = selectedEvents.includes(event);
                return (
                  <Pressable key={event} onPress={() => toggleEvent(event)}
                    style={[styles.eventChip, isSelected && styles.eventChipSelected]}>
                    <Text style={[styles.eventChipText, isSelected && styles.eventChipTextSelected]}>{event}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Athlètes */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('all_athletes')} ({selectedAthletes.length})</Text>
            {athletes.map((a: any) => {
              const isSelected = selectedAthletes.includes(a.id);
              return (
                <Pressable key={a.id} onPress={() => toggleAthlete(a.id)}
                  style={[styles.athleteRow, isSelected && styles.athleteRowSelected]}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
                  </View>
                  <Text verbatim style={styles.athleteName}>{a.name}</Text>
                  <Text style={styles.athleteEvents}>{a.events.join(', ')}</Text>
                </Pressable>
              );
            })}
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
  deleteBtnHeader: {
    padding: 8, backgroundColor: Colors.error + '12', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: 120 },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 8 },
  optionalLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.weightMedium },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 13, fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateText: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  multiDayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: Colors.info + '10', borderRadius: Radius.sm, padding: 8,
    borderWidth: 1, borderColor: Colors.info + '30',
  },
  multiDayText: { fontSize: Typography.fontSizeSM, color: Colors.info, fontWeight: Typography.weightSemibold, flex: 1 },
  venueRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  mapBtn: {
    width: 48, height: 48, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#1A73E8' + '60',
    backgroundColor: '#1A73E8' + '10', alignItems: 'center', justifyContent: 'center',
  },
  mapBtnDisabled: { borderColor: Colors.border, backgroundColor: Colors.surface },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  automaticStatus: { minHeight: 48, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  automaticStatusText: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold },
  statusHint: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26, marginTop: Spacing.sm, flexShrink: 1 },
  dateError: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cancellationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  cancellationLabel: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  eventChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  eventChipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  eventChipText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  eventChipTextSelected: { color: Colors.primary, fontWeight: Typography.weightSemibold },
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
  athleteName: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  athleteEvents: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
});
