// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { TrainingPlan } from '@/types';
import { EVENT_GROUPS } from '@/constants/config';
import { useI18n } from '@/hooks/useI18n';
import { normalizeGroupId } from '@/services/disciplineService';
import { Badge } from '@/components/ui/Badge';

interface PlanCardProps {
  plan: TrainingPlan;
  onPress: () => void;
  athleteCount?: number;
}

const PHASE_COLORS: Record<string, string> = {
  Base: '#60A5FA', Build: '#FBBF24', Peak: '#F87171', Taper: '#A78BFA', Competition: '#FFD700', Recovery: '#34D399',
};

export const PlanCard = React.memo(({ plan, onPress, athleteCount }: PlanCardProps) => {
  const { t } = useI18n();
  const group = EVENT_GROUPS.find(g => g.id === normalizeGroupId(plan.group));
  const groupColor = group?.color || Colors.primary;
  const phaseColor = PHASE_COLORS[plan.phase] || Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Shadow.card, pressed && styles.pressed]}
      accessibilityLabel={plan.title}
    >
      <View style={[styles.accentBar, { backgroundColor: groupColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Badge label={plan.phase} color={phaseColor} />
          <Badge label={group ? t(group.labelKey) : plan.group} color={groupColor} />
        </View>
        <Text verbatim style={styles.title}>{plan.title}</Text>
        <Text verbatim style={styles.description} numberOfLines={2}>{plan.description}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="calendar-today" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{plan.weeks} {t('weeks')} · {plan.startDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="people" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{athleteCount ?? plan.athleteIds.length} {t('athletes').toLowerCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="fitness-center" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{plan.sessions.length} {t('sessions')}</Text>
          </View>
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
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  accentBar: { width: 4 },
  content: { flex: 1, padding: Spacing.md },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
});
