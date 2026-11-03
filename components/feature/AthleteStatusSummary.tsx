import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useAthleteStatusCounts } from '@/hooks/useAdvancedAnalytics';
import { useI18n } from '@/hooks/useI18n';

interface AthleteStatusSummaryProps { compact?: boolean }
export const AthleteStatusSummary = memo(function AthleteStatusSummary({ compact = false }: AthleteStatusSummaryProps) {
  const counts = useAthleteStatusCounts();
  const { t } = useI18n();
  return (
    <View style={styles.grid}>
      <View style={styles.item}><Text style={[styles.value, { color: Colors.success }]}>{counts.active}</Text><Text style={styles.label}>{t('active')}</Text></View>
      <View style={styles.item}><Text style={[styles.value, { color: Colors.error }]}>{counts.injured}</Text><Text style={styles.label}>{t('injured')}</Text></View>
      <View style={styles.item}><Text style={[styles.value, { color: Colors.textSecondary }]}>{counts.inactive}</Text><Text style={styles.label}>{t('inactive')}</Text></View>
      <View style={styles.item}><Text style={[styles.value, { color: Colors.primary }]}>{counts.total}</Text><Text accessibilityLabel={t('all_athletes')} style={styles.label}>{t('total')}</Text></View>
    </View>
  );
});
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: Spacing.xs, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  item: { flex: 1, minWidth: 1, alignItems: 'center', gap: Spacing.xs },
  value: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, includeFontPadding: false },
  label: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, includeFontPadding: false },
});
