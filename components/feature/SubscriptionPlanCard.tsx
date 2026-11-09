import { memo } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface SubscriptionPlanCardProps { compact?: boolean; horizontalPadding?: number }
export const SubscriptionPlanCard = memo(function SubscriptionPlanCard({ compact = false, horizontalPadding }: SubscriptionPlanCardProps) {
  const { config, currentName, isAthlete, entries, subscribed } = useSubscriptionUsage();
  const router = useRouter();
  const testMode = useBilling().configuration?.testMode === true;
  if (isAthlete) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abonnement ${currentName}, voir les formules`} onPress={() => router.push({ pathname: '/upgrade', params: { tier: config.id } })} style={({ pressed }) => [styles.card, horizontalPadding !== undefined ? { marginHorizontal: horizontalPadding } : null, pressed ? styles.pressed : null]}>
    <View style={styles.heading}><View style={[styles.icon, { backgroundColor: config.color + '12' }]}><MaterialIcons name={config.icon as any} size={20} color={config.color} /></View><View style={styles.info}><Text style={styles.label}>{testMode ? 'Mon abonnement · Stripe test' : 'Mon abonnement'}</Text><Text style={[styles.title, { color: config.color }]}>{subscribed ? currentName : 'Formule gratuite'}</Text></View><MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} /></View>
    {!compact ? <View style={styles.usage}>{entries.map(item => <View key={item.id} style={styles.item}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, item.full ? styles.full : null]}>{item.display}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>{item.label}</Text></View>)}</View> : null}
  </Pressable>;
});
const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 1, gap: Spacing.xs }, label: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, includeFontPadding: false },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, includeFontPadding: false },
  usage: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  item: { flex: 1, minWidth: 1, gap: Spacing.xs }, value: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Typography.weightSemibold }, full: { color: Colors.warning },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
