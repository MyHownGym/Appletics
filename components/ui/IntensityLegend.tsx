// Powered by OnSpace.AI
import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { INTENSITY_LEVELS } from '@/constants/config';
import { useI18n } from '@/hooks/useI18n';
import { IntensityDot } from './IntensityDot';

interface IntensityLegendProps {
  showCompetitions?: boolean;
}

export const IntensityLegend = memo(function IntensityLegend({ showCompetitions = false }: IntensityLegendProps) {
  const { t } = useI18n();
  return (
    <View style={styles.legend}>
      {INTENSITY_LEVELS.map(level => (
        <View key={level.id} style={styles.item}>
          <IntensityDot intensity={level.id} size={8} />
          <Text style={styles.label}>{t(level.labelKey)}</Text>
        </View>
      ))}
      {showCompetitions ? (
        <View style={styles.item}>
          <MaterialIcons name="emoji-events" size={14} color={Colors.warning} />
          <Text style={styles.label}>{t('competitions')}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  label: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
});
