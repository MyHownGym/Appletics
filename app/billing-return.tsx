import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBilling } from '@/hooks/useBilling';
import { BillingStatusPanel } from '@/components/feature/BillingStatusPanel';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
export default function BillingReturnScreen() {
  const billing = useBilling();
  const router = useRouter();
  useEffect(() => { void billing.refresh(); }, [billing.refresh]);
  // Never activates a tier from URL parameters; the provider verifies Stripe under the authenticated account.
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><View style={styles.content}>
    <Text style={styles.title}>Retour à Appletics</Text><BillingStatusPanel />
    <Pressable onPress={() => router.replace('/upgrade')} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.buttonText}>Abonnement test</Text></Pressable>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, content: { padding: Spacing.md, gap: Spacing.lg, width: '100%', maxWidth: 600, alignSelf: 'center' },
  title: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary }, button: { padding: Spacing.md, minHeight: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.welcomeDeep }, buttonText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary }, pressed: { opacity: 0.7 },
});
