import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { SessionPerformance } from '@/types';

const dateLabel = (iso: string) => {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Times and measures entered by athletes on training sessions (synced from their app).
// filter: one session, one athlete, or (default) every athlete of the coach — newest first.
export const TrainingLogList = memo(function TrainingLogList({ title, sessionId, athleteId, limit = 8, empty, horizontalPadding = 0 }: {
  title: string; sessionId?: string; athleteId?: string; limit?: number; empty?: string; horizontalPadding?: number;
}) {
  const { sessionPerformances, trainingPlans, athletes, user } = useApp();
  const router = useRouter();
  const entries = useMemo(() => {
    const mine = new Set(athletes.map(item => item.id));
    return sessionPerformances
      .filter(item => item.metrics?.length && (sessionId ? item.sessionId === sessionId : true) && (athleteId ? item.athleteId === athleteId : mine.has(item.athleteId)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, limit);
  }, [sessionPerformances, athletes, sessionId, athleteId, limit]);
  if (user.userType === 'athlete') return null;
  if (!entries.length && !empty) return null;
  const sessionTitle = (item: SessionPerformance) => trainingPlans.find(plan => plan.id === item.planId)?.sessions.find(session => session.id === item.sessionId)?.title ?? 'Séance';
  const athleteName = (item: SessionPerformance) => athletes.find(athlete => athlete.id === item.athleteId)?.name ?? item.athleteName;
  return <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
    <Text style={styles.heading}>{title}</Text>
    {entries.length ? entries.map(item => (
      <Pressable key={item.id} accessibilityRole="button" disabled={!!sessionId}
        onPress={() => router.push({ pathname: '/session-edit', params: { planId: item.planId, sessionId: item.sessionId } })}
        style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
        <View style={styles.top}>
          <MaterialIcons name="timer" size={18} color={Colors.primary} />
          <Text verbatim style={styles.title} numberOfLines={1}>{sessionId ? athleteName(item) : athleteId ? sessionTitle(item) : `${athleteName(item)} · ${sessionTitle(item)}`}</Text>
          <Text verbatim style={styles.date}>{dateLabel(item.date)}</Text>
        </View>
        <View style={styles.metrics}>
          {item.metrics.slice(0, 12).map((metric, index) => (
            <View key={`${metric.label}-${index}`} style={styles.metric}>
              <Text verbatim style={styles.metricLabel} numberOfLines={1}>{metric.label}</Text>
              <Text verbatim style={styles.metricValue}>{`${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`}</Text>
            </View>
          ))}
        </View>
        {item.notes?.trim() ? <Text verbatim style={styles.notes} numberOfLines={3}>{item.notes.trim()}</Text> : null}
      </Pressable>
    )) : <View style={styles.card}><Text style={styles.notes}>{empty}</Text></View>}
  </View>;
});

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.md },
  heading: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  date: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textTransform: 'capitalize' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6, minWidth: 72 },
  metricLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  metricValue: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  notes: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
});
