// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { Competition } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useCompetitionPresentation } from '@/hooks/useCompetitionPresentation';
import { useI18n } from '@/hooks/useI18n';

interface CompetitionCardProps {
  competition: Competition;
  onPress: () => void;
}

const STATUS_COLORS = { upcoming: Colors.primary, completed: Colors.success, cancelled: Colors.error };
const TYPE_COLORS: Record<string, string> = {
  Championship: '#F87171', Invitational: '#60A5FA', Indoor: '#A78BFA',
  Outdoor: '#34D399', 'Cross Country': '#FBBF24', 'Road Race': '#FF6B35',
};

export const CompetitionCard = React.memo(({ competition, onPress }: CompetitionCardProps) => {
  const { t, language } = useI18n();
  const presentation = useCompetitionPresentation(competition);
  const statusColor = STATUS_COLORS[competition.status] || Colors.primary;
  const typeColor = TYPE_COLORS[competition.type] || Colors.info;
  const dateObj = presentation.date;
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleString(language, { month: 'short' }).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Shadow.card, pressed && styles.pressed]}
      accessibilityLabel={competition.name}
    >
      <View style={[styles.dateBox, { borderColor: statusColor + '40', backgroundColor: statusColor + '15' }]}>
        <Text style={[styles.dayNum, { color: statusColor }]}>{dayNum}</Text>
        <Text style={[styles.month, { color: statusColor }]}>{month}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Badge label={presentation.typeLabel} color={typeColor} size="sm" />
          <Badge label={presentation.statusLabel} color={statusColor} size="sm" />
        </View>
        <Text style={styles.name} numberOfLines={1}>{competition.name}</Text>
        <View style={styles.row}>
          <MaterialIcons name="place" size={13} color={Colors.textMuted} />
          <Text style={styles.location}>{presentation.venueLabel}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.row}>
            <MaterialIcons name="people" size={13} color={Colors.textMuted} />
            <Text style={styles.meta}>{competition.athleteIds.length + (competition.teammates?.length ?? 0)} {t('athletes').toLowerCase()}</Text>
          </View>
          {competition.teamScore !== undefined ? (
            <View style={styles.scoreChip}>
              <MaterialIcons name="emoji-events" size={13} color={Colors.primary} />
              <Text style={styles.scoreText}>{competition.teamScore} pts{competition.teamRank ? ` · ${t('team_rank')} #${competition.teamRank}` : ''}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: { opacity: 0.8 },
  dateBox: {
    width: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayNum: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightExtrabold, lineHeight: 26 },
  month: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, letterSpacing: 1 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  name: {
    fontSize: Typography.fontSizeBase,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, flex: 1 },
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  meta: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  scoreText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.weightSemibold },
});
