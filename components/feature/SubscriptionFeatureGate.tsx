import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureFlag } from '@/constants/subscription';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface SubscriptionFeatureGateProps { feature: FeatureFlag; title: string }
export const SubscriptionFeatureGate = memo(function SubscriptionFeatureGate({ feature, title }: SubscriptionFeatureGateProps) {
  const { tiers, isAthlete } = useSubscription();
  const router = useRouter();
  const minimum = tiers.find(plan => plan.features.includes(feature));
  return <View style={styles.panel}><MaterialIcons name="lock-outline" size={24} color={Colors.info} /><Text style={styles.title}>{title}</Text><Text style={styles.body}>{isAthlete ? 'Cette fonction dépend de la formule du coach.' : `Disponible à partir de ${minimum?.name ?? 'Elite'}. Les PBs et l’historique restent accessibles.`}</Text>{!isAthlete && minimum ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/upgrade', params: { tier: minimum.id, reason: title } })} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.buttonText}>Voir {minimum.name}</Text><MaterialIcons name="arrow-forward" size={18} color={Colors.info} /></Pressable> : null}</View>;
});
const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.info + '08', borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.info + '25' },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textPrimary }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary },
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surface }, buttonText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.info }, pressed: { opacity: 0.75 },
});
