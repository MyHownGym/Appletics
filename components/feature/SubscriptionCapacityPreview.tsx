import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import type { TierConfig } from '@/constants/subscription';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface CapacityItemProps { value: number; label: string }
const CapacityItem = memo(function CapacityItem({ value, label }: CapacityItemProps) {
  return <View style={styles.item}><Text verbatim style={styles.value}>{value === -1 ? '∞' : value}</Text><Text style={styles.label}>{label}</Text></View>;
});
interface SubscriptionCapacityPreviewProps { plan: TierConfig }
export const SubscriptionCapacityPreview = memo(function SubscriptionCapacityPreview({ plan }: SubscriptionCapacityPreviewProps) {
  return <View style={styles.row}>
    <CapacityItem value={plan.limits.athletes} label="Athlètes" />
    <CapacityItem value={plan.limits.trainingPlans} label="Plans" />
    <CapacityItem value={plan.track === 'club' ? plan.limits.coaches : plan.limits.competitions} label={plan.track === 'club' ? 'Coachs' : 'Compétitions'} />
  </View>;
});
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.welcomeLine }, item: { flex: 1, gap: Spacing.xs, alignItems: 'center' },
  value: { fontSize: Typography.fontSizeXL, color: Colors.textOnPrimary, fontWeight: Typography.weightBold }, label: { fontSize: Typography.fontSizeBase, color: Colors.welcomeText, textAlign: 'center', flexShrink: 1 },
});
