import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHomeActivitySummary } from '@/hooks/useHomeActivitySummary';
import { useI18n } from '@/hooks/useI18n';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

interface SummaryCardProps {
  count: number | string;
  label: string;
  accessibilityLabel: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
  compact?: boolean;
}
const SummaryCard = memo(function SummaryCard({ count, label, accessibilityLabel, icon, color, onPress, compact = false }: SummaryCardProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${count} ${accessibilityLabel}`} onPress={onPress} style={({ pressed }) => [styles.card, Shadow.card, compact ? styles.compact : null, pressed ? styles.pressed : null]}>
    <View style={[styles.icon, { backgroundColor: color + '12' }]}><MaterialIcons name={icon} size={22} color={color} /></View>
    <Text style={[styles.value, { color }]}>{count}</Text>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.label, compact ? styles.compactLabel : null]}>{label}</Text>
  </Pressable>;
});
interface HomeActivitySummaryProps { horizontalPadding: number }
export const HomeActivitySummary = memo(function HomeActivitySummary({ horizontalPadding }: HomeActivitySummaryProps) {
  const summary = useHomeActivitySummary();
  const { t } = useI18n();
  return <View style={[styles.row, { paddingHorizontal: horizontalPadding }]}>
    {!summary.isAthlete ? <SummaryCard count={summary.athleteCount} label={t('athletes')} accessibilityLabel={t('athletes')} icon="people" color={Colors.primary} onPress={summary.openAthletes} compact={summary.isClub} /> : null}
    {summary.isClub ? <SummaryCard count={summary.coachCount} label={t('coaches')} accessibilityLabel={t('coaches')} icon="sports" color={Colors.club} onPress={summary.openCoaches} compact /> : null}
    <SummaryCard count={summary.planCount} label={t('nav_plans')} accessibilityLabel={summary.isClub ? t('active_plans') : t('training_plans')} icon="event-note" color={Colors.info} onPress={summary.openPlans} compact={summary.isClub} />
    <SummaryCard count={summary.competitionCount} label={t('nav_meets')} accessibilityLabel={summary.isAthlete ? t('competitions') : t('upcoming_meets')} icon="emoji-events" color={Colors.warning} onPress={summary.openCompetitions} compact={summary.isClub} />
    {summary.isAthlete ? <SummaryCard count={summary.chatCount} label={t('nav_chat')} accessibilityLabel={t('chat_messages')} icon="chat" color={Colors.club} onPress={summary.openChat} /> : null}
  </View>;
});
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm, marginBottom: Spacing.lg },
  card: { flex: 1, minWidth: 1, minHeight: 120, padding: Spacing.sm, gap: Spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  compact: { paddingHorizontal: Spacing.xs },
  icon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, includeFontPadding: false },
  label: { width: '100%', textAlign: 'center', color: Colors.textSecondary, fontSize: Typography.fontSizeSM, fontWeight: Typography.weightMedium, includeFontPadding: false },
  compactLabel: { fontSize: Typography.fontSizeXS },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
