import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useBilling } from '@/hooks/useBilling';
import { getTierConfig, type SubscriptionTier } from '@/constants/subscription';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

const PROFILE = '/(tabs)/profile';
const REDIRECT_SECONDS = 4;

// After paying: Stripe is checked (a few tries, the webhook can take a moment), a confirmation is
// shown, then the profile opens on its own. The tier is never taken from the URL.
export default function BillingReturnScreen() {
  const billing = useBilling();
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const done = useRef(false);
  const confirmed = billing.state.subscribed && !!billing.state.tier;
  const exhausted = attempts >= 6 && !confirmed;

  useEffect(() => {
    if (confirmed || attempts >= 6) return;
    const timer = setTimeout(() => { void billing.refresh().finally(() => setAttempts(value => value + 1)); }, attempts === 0 ? 0 : 2500);
    return () => clearTimeout(timer);
  }, [attempts, confirmed, billing.refresh]);

  useEffect(() => {
    if (!confirmed) return;
    if (countdown <= 0) { if (!done.current) { done.current = true; router.replace(PROFILE as any); } return; }
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [confirmed, countdown, router]);

  const plan = confirmed ? getTierConfig(billing.state.tier as SubscriptionTier) : null;
  const renew = billing.state.currentPeriodEnd ? new Date(billing.state.currentPeriodEnd).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><View style={styles.content}>
    {plan ? <LinearGradient colors={['#FF7A4D', '#FF5722', '#D93C10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.check}><MaterialIcons name="check" size={44} color={Colors.primary} /></View>
      <Text style={styles.kicker}>Paiement confirmé</Text>
      <Text style={styles.title}>{`Bienvenue dans ${plan.name} !`}</Text>
      <Text style={styles.body}>{renew ? `Votre formule est active. Prochain renouvellement le ${renew}.` : 'Votre formule est active.'}</Text>
      <Text style={styles.small}>{`Retour à votre profil dans ${countdown} s…`}</Text>
    </LinearGradient> : <View style={styles.pendingCard}>
      {exhausted ? <MaterialIcons name="hourglass-empty" size={40} color={Colors.warning} /> : <ActivityIndicator size="large" color={Colors.primary} />}
      <Text style={styles.pendingTitle}>{exhausted ? 'Paiement en cours de vérification' : 'Vérification du paiement…'}</Text>
      <Text style={styles.pendingBody}>{exhausted ? 'Stripe n’a pas encore confirmé le paiement. Si vous avez annulé, aucun montant n’est prélevé. Sinon, la formule s’activera dans quelques instants.' : 'Un instant, nous confirmons votre abonnement auprès de Stripe.'}</Text>
      {exhausted ? <Pressable onPress={() => setAttempts(0)} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}><Text style={styles.secondaryText}>Vérifier à nouveau</Text></Pressable> : null}
    </View>}
    <Pressable onPress={() => { done.current = true; router.replace(PROFILE as any); }} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}>
      <MaterialIcons name="person" size={20} color={Colors.textOnPrimary} /><Text style={styles.buttonText}>Aller à mon profil</Text>
    </Pressable>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center' },
  card: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  check: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  kicker: { color: 'rgba(255,255,255,0.9)', fontWeight: Typography.weightBold, fontSize: Typography.fontSizeSM, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#FFFFFF', fontWeight: Typography.weightExtrabold, fontSize: Typography.fontSizeXL, textAlign: 'center' },
  body: { color: '#FFFFFF', fontSize: Typography.fontSizeBase, textAlign: 'center', lineHeight: 24 },
  small: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.fontSizeSM, marginTop: Spacing.sm },
  pendingCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  pendingTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  pendingBody: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  secondary: { paddingHorizontal: Spacing.lg, minHeight: 44, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  button: { flexDirection: 'row', gap: 8, padding: Spacing.md, minHeight: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.welcomeDeep },
  buttonText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary },
  pressed: { opacity: 0.7 },
});
