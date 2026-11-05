import { memo } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { BillingCheckoutReview } from '@/components/feature/BillingCheckoutReview';
import { useBillingReview } from '@/hooks/useBillingReview';
import type { SubscriptionTier } from '@/constants/subscription';
import type { BillingCycle } from '@/constants/subscriptionPricing';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { getTierConfig } from '@/constants/subscription';

interface BillingPaymentActionsProps { tier: SubscriptionTier; cycle: BillingCycle; name: string }
export const BillingPaymentActions = memo(function BillingPaymentActions({ tier, cycle, name }: BillingPaymentActionsProps) {
  const review = useBillingReview(tier, cycle, name);
  const { actions } = review;
  const scheduledSelection = actions.state.pendingTier === tier && actions.state.pendingCycle === cycle && !!actions.state.pendingChangeAt;
  const disabled = actions.busy || actions.loading || review.accountLoading || actions.current || scheduledSelection;
  const manageable = actions.hasSubscription || actions.hasPendingPayment;
  return <View style={styles.panel}>
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, busy: actions.busy || review.accountLoading }} onPress={review.openReview} style={({ pressed }) => [styles.primary, pressed || disabled ? styles.pressed : null]}>
      {actions.busy || review.accountLoading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <MaterialIcons name={actions.current ? 'check-circle-outline' : 'arrow-forward'} size={22} color={Colors.textOnPrimary} />}
      <Text style={styles.primaryText}>{scheduledSelection ? 'Changement déjà programmé' : actions.current ? 'Votre formule actuelle' : actions.hasSubscription ? 'Voir le résumé du changement' : 'Continuer'}</Text>
    </Pressable>
    <View style={styles.secure}><MaterialIcons name="lock-outline" size={16} color={Colors.textSecondary} /><Text style={styles.hint}>Carte · TWINT · Apple Pay · Google Pay</Text></View>
    {actions.pending || actions.hasPendingPayment ? <Text accessibilityLiveRegion="polite" style={styles.body}>Paiement en attente de confirmation.</Text> : null}
    {actions.error ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={[styles.body, styles.error]}>{actions.error}</Text></View> : null}
    {actions.message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{actions.message}</Text> : null}
    {actions.state.pendingTier && actions.state.pendingChangeAt ? <View style={styles.scheduled}><MaterialIcons name="event-available" size={22} color={Colors.clubDeep} /><Text accessibilityLiveRegion="polite" style={styles.body}>{`Changement programmé : ${getTierConfig(actions.state.pendingTier).name} · ${actions.formatDate(actions.state.pendingChangeAt)}`}</Text></View> : null}
    {actions.configurationError && !actions.error ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text style={[styles.body, styles.error]}>{actions.configurationError}</Text></View> : null}
    {manageable ? <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: review.managementOpen }} onPress={review.toggleManagement} style={({ pressed }) => [styles.manage, pressed ? styles.pressed : null]}><Text style={styles.manageText}>Gérer mon abonnement</Text><MaterialIcons name={review.managementOpen ? 'expand-less' : 'expand-more'} size={24} color={Colors.textSecondary} /></Pressable>
      {review.managementOpen ? <View style={styles.management}>
        {actions.state.currentPeriodEnd ? <Text style={styles.body}>{actions.cancellationScheduled ? `Accès jusqu’au : ${actions.formatDate(actions.state.cancelAt ?? actions.state.currentPeriodEnd)}` : `Prochaine échéance : ${actions.formatDate(actions.state.currentPeriodEnd)}`}</Text> : null}
        {actions.state.commitmentEnd ? <Text style={styles.body}>{`Engagement jusqu’au : ${actions.formatDate(actions.state.commitmentEnd)}`}</Text> : null}
        <Pressable disabled={actions.busy || actions.loading} accessibilityRole="button" onPress={() => { void actions.refresh(); }} style={({ pressed }) => [styles.secondary, pressed || actions.busy || actions.loading ? styles.pressed : null]}><MaterialIcons name="refresh" size={22} color={Colors.welcomeDeep} /><Text style={styles.secondaryText}>Vérifier le paiement</Text></Pressable>
        {actions.hasPendingPayment ? <Pressable disabled={actions.busy || actions.loading} accessibilityRole="button" onPress={actions.discardPending} style={({ pressed }) => [styles.secondary, pressed || actions.busy ? styles.pressed : null]}><Text style={[styles.secondaryText, styles.danger]}>Abandonner le paiement natif en attente</Text></Pressable> : null}
        {actions.hasSubscription ? <>
          <Pressable disabled={actions.busy} accessibilityRole="button" onPress={() => { void actions.openPortal(); }} style={({ pressed }) => [styles.secondary, pressed || actions.busy ? styles.pressed : null]}><MaterialIcons name="receipt-long" size={22} color={Colors.welcomeDeep} /><Text style={styles.secondaryText}>Moyen de paiement et factures test</Text></Pressable>
          {actions.cancellationScheduled ? <Pressable disabled={actions.busy} accessibilityRole="button" onPress={() => { void actions.resume(); }} style={({ pressed }) => [styles.secondary, pressed || actions.busy ? styles.pressed : null]}><Text style={styles.secondaryText}>Réactiver le renouvellement</Text></Pressable> : <Pressable disabled={actions.busy} accessibilityRole="button" onPress={actions.requestCancel} style={({ pressed }) => [styles.secondary, pressed || actions.busy ? styles.pressed : null]}><Text style={[styles.secondaryText, styles.danger]}>Résilier à l’échéance</Text></Pressable>}
        </> : null}
      </View> : null}
    </> : null}
    <BillingCheckoutReview review={review} name={name} />
  </View>;
});
const styles = StyleSheet.create({
  panel: { gap: Spacing.sm }, primary: { minHeight: 56, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.welcomeDeep }, primaryText: { color: Colors.textOnPrimary, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, textAlign: 'center', flexShrink: 1 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs }, hint: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, flexShrink: 1, lineHeight: 21, textAlign: 'center' },
  body: { flexShrink: 1, color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 26, includeFontPadding: false }, feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }, error: { color: Colors.error, flex: 1 },
  scheduled: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.clubDeep, borderRadius: Radius.md, backgroundColor: Colors.surface },
  manage: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.sm }, manageText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary }, management: { gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, backgroundColor: Colors.surface },
  secondary: { minHeight: 48, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, secondaryText: { color: Colors.welcomeDeep, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, flexShrink: 1, textAlign: 'center' }, danger: { color: Colors.error }, pressed: { opacity: 0.65 },
});
