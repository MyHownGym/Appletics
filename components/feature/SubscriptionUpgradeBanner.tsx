import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface SubscriptionUpgradeBannerProps { label?: string }
export const SubscriptionUpgradeBanner = memo(function SubscriptionUpgradeBanner({ label }: SubscriptionUpgradeBannerProps) {
  const router = useRouter();
  const { nextTier, isTopTier, isAthlete } = useSubscription();
  const next = nextTier();
  if (!next || isTopTier || isAthlete) return null;
  return <Pressable accessibilityLabel={label || `Passer à ${next.name}`} onPress={() => router.push({ pathname: '/upgrade', params: { tier: next.id } })} style={({ pressed }) => [styles.banner, { backgroundColor: next.color + '10', borderColor: next.color + '40' }, pressed ? styles.pressed : null]}>
    <View style={[styles.icon, { backgroundColor: next.color + '18' }]}><MaterialIcons name={next.icon as any} size={24} color={next.color} /></View>
    <View style={styles.info}><Text style={[styles.title, { color: next.color }]}>{label || `Passer à ${next.name}`}</Text><Text style={styles.subtitle}>{next.price}{next.priceNote} · {next.subtitle}</Text></View>
    <MaterialIcons name="chevron-right" size={22} color={next.color} />
  </Pressable>;
});
const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, minHeight: 64 },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 1 }, title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  subtitle: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary, marginTop: Spacing.xs },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
