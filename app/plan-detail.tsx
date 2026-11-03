// Powered by OnSpace.AI
// v3 - fix calendar date click, sessions shown by exact date
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { weekdayLabel } from '@/services/localizationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { Badge, IntensityDot } from '@/components';
import { TrainingSession } from '@/types';
import { EVENT_GROUPS, INTENSITY_LEVELS, DAYS_OF_WEEK } from '@/constants/config';
import { IntensityLegend } from '@/components/ui/IntensityLegend';

const PHASE_COLORS: Record<string, string> = {
  Base: '#60A5FA', Build: '#FBBF24', Peak: '#F87171', Taper: '#A78BFA', Competition: '#FFD700', Recovery: '#34D399',
};

const PHASE_LABELS: Record<string, string> = {
  Base: 'Base', Build: 'Développement', Peak: 'Pic de forme',
  Taper: 'Affûtage', Competition: 'Compétition', Recovery: 'Récupération',
};

const DAY_LABELS: Record<string, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
  Lun: 'Lun', Mar: 'Mar', Mer: 'Mer', Jeu: 'Jeu', Ven: 'Ven', Sam: 'Sam', Dim: 'Dim',
};

const SESSION_TYPE_ICONS: Record<string, string> = {
  track: 'directions-run', gym: 'fitness-center', road: 'terrain',
  rest: 'hotel', pool: 'pool', other: 'sports',
};

// Returns sessions for a specific date string YYYY-MM-DD
function getSessionsForExactDate(sessions: TrainingSession[], dateStr: string): TrainingSession[] {
  const targetDate = new Date(dateStr + 'T00:00:00');
  const dow = targetDate.getDay(); // 0=Sun
  const adjustedDow = dow === 0 ? 6 : dow - 1; // 0=Mon
  const weekdayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayKeysFr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const enKey = weekdayKeys[adjustedDow];
  const frKey = weekdayKeysFr[adjustedDow];

  return sessions.filter(s => {
    if (s.sessionDate) return s.sessionDate === dateStr;
    return s.day === enKey || s.day === frKey;
  });
}

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trainingPlans, athletes, deleteTrainingPlan } = useApp();
  const { showAlert } = useAlert();
  const { t, locale, language } = useI18n();

  const plan = trainingPlans.find(p => p.id === id);

  const [selectedDay, setSelectedDay] = useState<string | null>(null); // weekday key (Mon/Lun/etc)
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // exact YYYY-MM-DD
  const [calView, setCalView] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const base = plan?.startDate || new Date().toISOString().split('T')[0];
    return base.slice(0, 7);
  });

  if (!plan) return null;

  const group = EVENT_GROUPS.find(g => g.id === plan.group);
  const groupColor = group?.color || Colors.primary;
  const phaseColor = PHASE_COLORS[plan.phase] || Colors.primary;
  const planAthletes = athletes.filter(a => plan.athleteIds.includes(a.id));

  // Filter by exact date (from calendar click) or by weekday (from chip click)
  const filteredSessions = selectedDate
    ? getSessionsForExactDate(plan.sessions, selectedDate)
    : selectedDay
    ? plan.sessions.filter(s => s.day === selectedDay || DAY_LABELS[s.day] === selectedDay || s.day === DAY_LABELS[selectedDay])
    : plan.sessions;

  const handleDelete = () => {
    showAlert(t('delete'), `${t('delete')} "${plan.title}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: () => {
          deleteTrainingPlan(plan.id);
          router.back();
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push({ pathname: '/plan-create', params: { id: plan.id } })}
            style={styles.editBtn}
            hitSlop={4}
          >
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Plan info */}
        <View style={[styles.planHeader, { borderLeftColor: groupColor }]}>
          <View style={styles.badges}>
            <Badge label={PHASE_LABELS[plan.phase] || plan.phase} color={phaseColor} />
            <Badge label={group ? t(group.labelKey) : plan.group} color={groupColor} />
          </View>
          <Text verbatim style={styles.planTitle}>{plan.title}</Text>
          <Text verbatim style={styles.planDesc}>{plan.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="calendar-today" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{plan.startDate} → {plan.endDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="view-week" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{plan.weeks} {t('weeks')}</Text>
            </View>
          </View>
        </View>

        {/* Athletes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('all_athletes')} ({planAthletes.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.athleteChips}>
              {planAthletes.length === 0 ? (
                <Text style={styles.noAthletesText}>Aucun athlète assigné</Text>
              ) : planAthletes.map(a => {
                const grp = EVENT_GROUPS.find(g => g.id === a.group);
                const col = grp?.color || Colors.primary;
                const initials = a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <Pressable
                    key={a.id}
                    style={[styles.athleteChip, { borderColor: col + '50', backgroundColor: col + '15' }]}
                    onPress={() => router.push({ pathname: '/athlete-detail', params: { id: a.id } })}
                  >
                    <Text style={[styles.athleteInitials, { color: col }]}>{initials}</Text>
                    <Text verbatim style={styles.athleteName}>{a.name.split(' ')[0]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Sessions header + view toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('sessions')} ({plan.sessions.length})</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                style={[styles.viewToggleBtn, calView && styles.viewToggleBtnActive]}
                onPress={() => {
                  setCalView(v => !v);
                  // Clear exact date filter when switching back to list
                  if (calView) { setSelectedDate(null); }
                }}
                hitSlop={4}
              >
                <MaterialIcons name={calView ? 'list' : 'calendar-month'} size={16} color={calView ? '#FFF' : Colors.primary} />
              </Pressable>
              <Pressable
                style={styles.addSessionBtn}
                onPress={() => router.push({ pathname: '/session-edit', params: { planId: plan.id } })}
              >
                <MaterialIcons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addSessionText}>{t('add')}</Text>
              </Pressable>
            </View>
          </View>

          {/* Calendar view */}
          {calView ? (
            <CalendarMonthView
              sessions={plan.sessions}
              currentMonth={calMonth}
              onMonthChange={setCalMonth}
              onDatePress={(dateStr) => {
                // Pass exact date, switch to list view showing sessions for that date
                setSelectedDate(dateStr);
                setSelectedDay(null);
                setCalView(false);
              }}
              startDate={plan.startDate}
              endDate={plan.endDate}
            />
          ) : (
            <>
              {/* Active filter indicator */}
              {selectedDate ? (
                <View style={styles.activeDateFilter}>
                  <MaterialIcons name="calendar-today" size={14} color={Colors.primary} />
                  <Text style={styles.activeDateFilterText}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                  <Pressable onPress={() => setSelectedDate(null)} hitSlop={8}>
                    <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                /* Day filter chips */
                <View style={styles.dayRow}>
                  {DAYS_OF_WEEK.map(day => {
                    const hasSessions = plan.sessions.some(s =>
                      s.day === day || DAY_LABELS[s.day] === day || s.day === DAY_LABELS[day]
                    );
                    const isSelected = selectedDay === day;
                    return (
                      <Pressable
                        key={day}
                        onPress={() => setSelectedDay(isSelected ? null : day)}
                        style={[
                          styles.dayBtn,
                          hasSessions && styles.dayBtnActive,
                          isSelected && styles.dayBtnSelected,
                        ]}
                      >
                        <Text style={[
                          styles.dayLabel,
                          hasSessions && styles.dayLabelActive,
                          isSelected && styles.dayLabelSelected,
                        ]}>{weekdayLabel(day, language)}</Text>
                        {hasSessions ? <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <View style={[styles.emptySection, { marginHorizontal: Spacing.screenPadding }]}>
            <MaterialIcons name="event-note" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {selectedDate
                ? `Aucune séance le ${new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long' })}`
                : t('no_plans')}
            </Text>
            <Pressable
              style={styles.addSessionBtnLarge}
              onPress={() => router.push({ pathname: '/session-edit', params: { planId: plan.id } })}
            >
              <MaterialIcons name="add" size={18} color="#FFF" />
              <Text style={styles.addSessionBtnLargeText}>{t('add')} {t('sessions')}</Text>
            </Pressable>
          </View>
        ) : (
          filteredSessions.map(session => {
            const intensity = INTENSITY_LEVELS.find(l => l.id === session.intensity);
            const icon = SESSION_TYPE_ICONS[session.type] || 'sports';
            const displayDate = session.sessionDate
              ? new Date(session.sessionDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
              : weekdayLabel(session.day, language);

            return (
              <View key={session.id} style={[styles.sessionCard, Shadow.card]}>
                <View style={styles.sessionHeader}>
                  <View style={[styles.sessionIconWrap, { backgroundColor: (intensity?.color || Colors.border) + '20' }]}>
                    <MaterialIcons name={icon as any} size={18} color={intensity?.color || Colors.border} />
                  </View>
                  <View style={styles.sessionMeta}>
                    <View style={styles.sessionTopRow}>
                      <Text style={styles.sessionDay}>{displayDate}</Text>
                      <IntensityDot intensity={session.intensity} size={10} />
                      <Text style={[styles.sessionIntensity, { color: intensity?.color || Colors.textMuted }]}>
                        {intensity ? t(intensity.labelKey) : session.intensity}
                      </Text>
                    </View>
                    <Text verbatim style={styles.sessionTitle}>{session.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {session.duration > 0 ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{session.duration}m</Text>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => router.push({ pathname: '/session-edit', params: { planId: plan.id, sessionId: session.id } })}
                      style={styles.editSessionBtn}
                      hitSlop={8}
                    >
                      <MaterialIcons name="edit" size={16} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
                <Text verbatim style={styles.sessionDetails}>{session.details}</Text>
              </View>
            );
          })
        )}

        {/* Add session bottom button */}
        {filteredSessions.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.addSessionBtnLarge, { marginHorizontal: Spacing.screenPadding, marginTop: 0 }, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/session-edit', params: { planId: plan.id } })}
          >
            <MaterialIcons name="add" size={18} color="#FFF" />
            <Text style={styles.addSessionBtnLargeText}>{t('add')} {t('sessions')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Monthly Calendar Sub-component ─────────────────────────────────────────
const MONTH_NAMES_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAY_ABBR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

// Mon-based weekday names matching session.day field
const WEEKDAY_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getSessionsForCalDay(sessions: TrainingSession[], year: number, month: number, day: number): TrainingSession[] {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dowJS = new Date(year, month - 1, day).getDay(); // 0=Sun
  const adjustedDow = dowJS === 0 ? 6 : dowJS - 1; // 0=Mon
  const enKey = WEEKDAY_EN[adjustedDow];
  const frKey = WEEKDAY_FR[adjustedDow];

  return sessions.filter(s => {
    if (s.sessionDate) return s.sessionDate === dateStr;
    return s.day === enKey || s.day === frKey;
  });
}

function CalendarMonthView({
  sessions, currentMonth, onMonthChange, onDatePress, startDate, endDate,
}: {
  sessions: TrainingSession[];
  currentMonth: string; // YYYY-MM
  onMonthChange: (m: string) => void;
  onDatePress: (dateStr: string) => void; // exact YYYY-MM-DD
  startDate?: string;
  endDate?: string;
}) {
  const { t, locale } = useI18n();
  const dayNames = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'].map(t);
  const [year, month] = currentMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = i - startOffset + 1;
    cells.push(d >= 1 && d <= daysInMonth ? d : null);
  }

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  const isInPlan = (d: number) => {
    if (!startDate || !endDate) return true;
    const dd = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dd >= startDate && dd <= endDate;
  };

  return (
    <View style={calStyles.container}>
      {/* Month nav */}
      <View style={calStyles.monthHeader}>
        <Pressable onPress={prevMonth} style={calStyles.navBtn} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={calStyles.monthTitle}>{new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long' })} {year}</Text>
        <Pressable onPress={nextMonth} style={calStyles.navBtn} hitSlop={8}>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>
      {/* Day headers */}
      <View style={calStyles.row}>
        {dayNames.map(d => (
          <Text key={d} style={calStyles.dayHeader}>{d}</Text>
        ))}
      </View>
      {/* Weeks */}
      {Array.from({ length: totalCells / 7 }).map((_, ri) => (
        <View key={ri} style={calStyles.row}>
          {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
            if (!day) return <View key={ci} style={calStyles.cell} />;
            const daySessions = getSessionsForCalDay(sessions, year, month, day);
            const inPlan = isInPlan(day);
            const todayCell = isToday(day);
            const hasSessions = daySessions.length > 0;
            const exactDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <Pressable
                key={ci}
                style={({ pressed }) => [
                  calStyles.cell,
                  todayCell && calStyles.todayCell,
                  hasSessions && calStyles.hasSessionCell,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => onDatePress(exactDateStr)}
              >
                <Text style={[
                  calStyles.dayNum,
                  todayCell && calStyles.todayNum,
                  !inPlan && calStyles.outNum,
                ]}>{day}</Text>
                {/* Session dots */}
                <View style={calStyles.dotsRow}>
                  {daySessions.slice(0, 3).map(s => (
                    <IntensityDot key={s.id} intensity={s.intensity} size={6} />
                  ))}
                  {daySessions.length > 3 ? (
                    <Text style={calStyles.moreText}>+{daySessions.length - 3}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <IntensityLegend />
      <Text style={calStyles.hint}>Appuyez sur une date pour voir les séances</Text>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.sm, marginBottom: Spacing.md,
  },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  dayHeader: {
    flex: 1, textAlign: 'center',
    fontSize: 10, color: Colors.textMuted, fontWeight: Typography.weightBold,
    marginBottom: 4, letterSpacing: 0.5,
  },
  cell: { flex: 1, minHeight: 48, alignItems: 'center', paddingTop: 4, borderRadius: 8 },
  todayCell: { backgroundColor: Colors.primary + '12', borderWidth: 1, borderColor: Colors.primary + '40' },
  hasSessionCell: { backgroundColor: Colors.surfaceElevated },
  dayNum: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  todayNum: { color: Colors.primary, fontWeight: Typography.weightExtrabold },
  outNum: { color: Colors.textMuted },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center' },
  moreText: { fontSize: 9, color: Colors.textMuted, fontWeight: Typography.weightBold },
  hint: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md,
  },
  backBtn: { padding: 8, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md },
  editBtn: { padding: 8, backgroundColor: Colors.primary + '15', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  deleteBtn: { padding: 8, backgroundColor: Colors.error + '15', borderRadius: Radius.md },
  scroll: { paddingBottom: 120 },
  planHeader: {
    margin: Spacing.screenPadding,
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4,
  },
  badges: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  planTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, marginBottom: 6 },
  planDesc: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.md },
  metaRow: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  viewToggleBtn: {
    width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary + '15', borderWidth: 1, borderColor: Colors.primary + '40',
  },
  viewToggleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addSessionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  addSessionText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.weightBold },
  activeDateFilter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '30', marginBottom: Spacing.sm,
  },
  activeDateFilterText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.primary, fontWeight: Typography.weightSemibold, textTransform: 'capitalize' },
  athleteChips: { flexDirection: 'row', gap: Spacing.sm },
  athleteChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1,
  },
  athleteInitials: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  athleteName: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  noAthletesText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, fontStyle: 'italic', paddingVertical: 8 },
  dayRow: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'space-between' },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, gap: 4,
  },
  dayBtnActive: { borderColor: Colors.borderLight, backgroundColor: Colors.surfaceCard },
  dayBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, color: Colors.textMuted },
  dayLabelActive: { color: Colors.textSecondary },
  dayLabelSelected: { color: '#FFF' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary },
  dayDotSelected: { backgroundColor: '#FFF' },
  sessionCard: {
    marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  sessionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionMeta: { flex: 1 },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  sessionDay: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'capitalize' },
  sessionIntensity: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold },
  sessionTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  durationBadge: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  durationText: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  sessionDetails: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  editSessionBtn: { padding: 6, backgroundColor: Colors.background, borderRadius: Radius.sm },
  emptySection: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  emptyText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, textAlign: 'center' },
  addSessionBtnLarge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 13,
    marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  addSessionBtnLargeText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
