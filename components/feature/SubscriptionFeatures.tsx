import { memo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { OfferRow } from '@/services/subscriptionOfferService';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface SubscriptionFeaturesProps { rows: OfferRow[]; color: string }
export const SubscriptionFeatures = memo(function SubscriptionFeatures({ rows, color }: SubscriptionFeaturesProps) {
  return <View style={styles.card}><Text style={styles.heading}>Capacités et fonctionnalités</Text><FlatList scrollEnabled={false} data={rows} keyExtractor={item => item.id} renderItem={({ item }) => <View style={styles.row}><MaterialIcons name={item.included ? 'check-circle-outline' : 'remove-circle-outline'} size={20} color={item.included ? color : Colors.textSecondary} /><Text style={[styles.label, !item.included ? styles.muted : null]}>{item.label}</Text><Text style={[styles.value, { color: item.included ? color : Colors.textSecondary }]}>{item.value}</Text></View>} /><Text style={styles.note}>Quotas partagés à l’échelle du compte ou du club, pas par coach. Tous les éléments enregistrés comptent, y compris les archives. Aucun plafond sur les PBs ou les résultats de vos athlètes.</Text></View>;
});
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md },
  heading: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.sm, includeFontPadding: false },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { flex: 1, minWidth: 1, fontSize: Typography.fontSizeBase, lineHeight: 24, color: Colors.textPrimary }, muted: { color: Colors.textSecondary },
  value: { maxWidth: '30%', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, textAlign: 'right' },
  note: { marginTop: Spacing.md, fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary },
});
