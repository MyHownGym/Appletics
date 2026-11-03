import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useI18n } from '@/hooks/useI18n';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface TrainingLoadChartProps { data: number[]; color: string; dates: string[] }
export const TrainingLoadChart = memo(function TrainingLoadChart({ data, color, dates }: TrainingLoadChartProps) {
  const { t } = useI18n();
  const max = Math.max(1, ...data);
  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        <View style={styles.axis}><Text style={styles.tick}>{max}</Text><Text style={styles.tick}>{Math.round(max / 2)}</Text><Text style={styles.tick}>0</Text></View>
        <View style={styles.bars}>
          {data.map((count, index) => <View key={index} style={styles.column}><View style={styles.barArea}><Text style={styles.count}>{count}</Text><View style={[styles.bar, { height: count === 0 ? 0 : Math.max(1, count / max * 120), backgroundColor: index === 0 ? color : count >= data[index - 1] ? Colors.success : Colors.error }]} /></View><Text style={styles.label}>{t('sem.')} {index + 1}</Text></View>)}
        </View>
      </View>
      <Text style={styles.caption}>Semaines du {dates[0]?.split('-').reverse().join('.') ?? '—'} au {dates[dates.length - 1]?.split('-').reverse().join('.') ?? '—'}.</Text>
      <Text style={styles.caption}>Séances planifiées d’après leurs dates ou les jours récurrents du plan, hors repos. Aucune donnée simulée.</Text>
    </View>
  );
});
const styles = StyleSheet.create({
  container: { width: '100%', gap: Spacing.sm },
  chart: { flexDirection: 'row', gap: Spacing.sm },
  axis: { width: 28, height: 144, justifyContent: 'space-between', paddingTop: Spacing.md },
  tick: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, includeFontPadding: false },
  bars: { flex: 1, flexDirection: 'row', gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  column: { flex: 1, minWidth: 1, alignItems: 'center', gap: Spacing.sm },
  barArea: { height: 144, width: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs },
  count: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  bar: { width: '65%', borderTopLeftRadius: Radius.sm, borderTopRightRadius: Radius.sm },
  label: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, paddingBottom: Spacing.sm },
  caption: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26, includeFontPadding: false },
});
