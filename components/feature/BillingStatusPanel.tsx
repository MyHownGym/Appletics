import { memo } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useBilling } from '@/hooks/useBilling';
import { useI18n } from '@/hooks/useI18n';
import { getTierConfig } from '@/constants/subscription';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface BillingStatusPanelProps { compact?: boolean }
export const BillingStatusPanel = memo(function BillingStatusPanel({ compact = false }: BillingStatusPanelProps) {
  const billing = useBilling();
  const { locale } = useI18n();
  const { state } = billing;
  const date = (value: string | null) => value ? new Date(value).toLocaleDateString(locale) : '—';
  const label = state.status === 'active' ? 'Actif' : state.status === 'past_due' ? 'Paiement en retard' : state.status === 'incomplete' ? 'Paiement à terminer' : state.status === 'canceled' ? 'Résilié' : state.status === 'unpaid' ? 'Paiement impayé' : 'Aucun abonnement confirmé';
  return <View style={styles.panel}>
    <View style={styles.heading}><MaterialIcons name="science" size={24} color={Colors.welcomeDeep} /><Text style={styles.title}>Stripe · mode test</Text></View>
    <Text style={styles.body}>Aucun débit réel. Utilisez uniquement les cartes de test Stripe.</Text>
    {billing.configuration ? <Text style={styles.ready}>Catalogue test vérifié · 18 tarifs</Text> : <Pressable onPress={() => { void billing.checkConfiguration(); }} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}><Text style={styles.secondaryText}>Vérifier la configuration Stripe</Text></Pressable>}
    {billing.configuration?.nativeReady ? <Text style={styles.ready}>Paiement intégré configuré · test sur appareil requis</Text> : null}
    {billing.configurationError ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text style={[styles.body, styles.error]}>{billing.configurationError}</Text></View> : null}
    <View style={styles.status}><Text style={styles.plan}>{state.subscribed && state.tier ? getTierConfig(state.tier).name : 'Accès local sans abonnement'}</Text><Text style={styles.body}>{label}</Text></View>
    {state.currentPeriodEnd ? <Text style={styles.body}>{state.cancelAt || state.cancelAtPeriodEnd ? 'Accès jusqu’au' : 'Prochaine échéance'} : {date(state.cancelAt ?? state.currentPeriodEnd)}</Text> : null}
    {state.commitmentEnd ? <Text style={styles.body}>Engagement jusqu’au : {date(state.commitmentEnd)}</Text> : null}
    {state.pendingTier ? <Text style={styles.body}>Changement programmé : {getTierConfig(state.pendingTier).name} · {date(state.pendingChangeAt)}</Text> : null}
    {billing.authenticated && !compact ? <Pressable disabled={billing.loading || billing.busy} accessibilityRole="button" onPress={() => { void billing.refresh(); }} style={({ pressed }) => [styles.secondary, pressed || billing.loading ? styles.pressed : null]}>{billing.loading ? <ActivityIndicator color={Colors.welcomeDeep} /> : <MaterialIcons name="refresh" size={22} color={Colors.welcomeDeep} />}<Text style={styles.secondaryText}>{billing.loading ? 'Vérification…' : 'Vérifier le paiement'}</Text></Pressable> : null}
    {billing.pending ? <Text style={styles.body}>Paiement en attente de confirmation. Vérification toutes les 10 secondes.</Text> : null}
    {billing.error ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={[styles.body, styles.error]}>{billing.error}</Text></View> : null}
    {billing.message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{billing.message}</Text> : null}
  </View>;
});
const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.primaryLight, borderColor: Colors.welcomeOrange, borderWidth: 1, padding: Spacing.md, borderRadius: Radius.lg, gap: Spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, title: { flex: 1, fontSize: Typography.fontSizeMD, color: Colors.welcomeDeep, fontWeight: Typography.weightBold },
  body: { color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 26, includeFontPadding: false, flexShrink: 1 }, ready: { color: Colors.clubDeep, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold },
  status: { borderTopColor: Colors.border, borderTopWidth: 1, paddingTop: Spacing.sm, gap: Spacing.xs }, plan: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  secondary: { minHeight: 48, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surface }, secondaryText: { color: Colors.welcomeDeep, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, flexShrink: 1, textAlign: 'center' },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }, error: { color: Colors.error, flex: 1 }, pressed: { opacity: 0.7 },
});
