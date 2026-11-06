import { memo } from 'react';
import { Modal, View, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { BillingAccountForm } from '@/components/auth/BillingAccountForm';
import type { useBillingReview } from '@/hooks/useBillingReview';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { useBilling } from '@/hooks/useBilling';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface SummaryRowProps { label: string; value: string }
const SummaryRow = memo(function SummaryRow({ label, value }: SummaryRowProps) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text verbatim style={styles.rowValue}>{value}</Text></View>;
});
interface BillingCheckoutReviewProps { review: ReturnType<typeof useBillingReview>; name: string }
export const BillingCheckoutReview = memo(function BillingCheckoutReview({ review, name }: BillingCheckoutReviewProps) {
  const { actions, summary } = review;
  const { translate } = useLocalizedCopy();
  const testMode = useBilling().configuration?.testMode === true;
  const consent = summary.cycle === 'annual_monthly'
    ? 'Engagement de 12 mois. Résiliation à son terme.'
    : summary.cycle === 'annual' ? 'Renouvellement annuel. Résiliation à l’échéance.' : 'Renouvellement mensuel. Résiliation à l’échéance.';
  return <Modal visible={review.reviewOpen} transparent animationType="slide" onRequestClose={review.closeReview}>
    <KeyboardAvoidingView style={styles.keyboardOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.flex}>
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.title}>{summary.changingPlan ? 'Votre changement de formule' : 'Avant de payer'}</Text>{testMode ? <Text style={styles.test}>TEST · aucun débit</Text> : null}</View>
            <Pressable accessibilityRole="button" accessibilityLabel={translate('Fermer le résumé')} disabled={actions.busy} onPress={review.closeReview} style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]}><MaterialIcons name="close" size={24} color={Colors.textPrimary} /></Pressable>
          </View>
          <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} contentContainerStyle={styles.content}>
            <View style={styles.summary}>
              <View style={styles.identity}><View style={styles.planCopy}><Text style={styles.eyebrow}>Formule choisie</Text><Text verbatim style={styles.plan}>{name}</Text></View><View style={styles.priceCopy}><Text verbatim style={styles.amount}>{review.amountLabel}</Text><Text style={styles.priceHint}>{summary.changingPlan ? 'à l’échéance' : 'à payer'}</Text></View></View>
              <SummaryRow label="Périodicité" value={review.cycleLabel} />
              {summary.changingPlan ? <SummaryRow label="Application du changement" value={review.startLabel} /> : null}
              <SummaryRow label={summary.estimated ? 'Prochain renouvellement (estimé)' : 'Prochain renouvellement'} value={review.renewalLabel} />
            </View>
            {summary.estimated ? <Text style={styles.hint}>{summary.changingPlan ? 'Aucun débit immédiat. La nouvelle formule commence à l’échéance affichée.' : 'Date estimée à partir du paiement. Stripe confirmera la date exacte.'}</Text> : null}
            {review.accountLoading ? <View style={styles.loading}><ActivityIndicator color={Colors.welcomeDeep} /><Text style={styles.body}>Restauration de votre session…</Text></View> : !actions.authenticated ? <BillingAccountForm checkout /> : <>
              <View style={styles.account}><MaterialIcons name="verified-user" size={20} color={Colors.clubDeep} /><Text verbatim numberOfLines={1} style={styles.email}>{review.accountEmail}</Text><Text style={styles.connected}>Connecté</Text></View>
              {actions.nativePayment && !actions.hasSubscription ? <View style={styles.methods}>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: review.method === 'native', disabled: actions.configuration?.nativeReady === false }} disabled={actions.configuration?.nativeReady === false} onPress={() => review.setMethod('native')} style={({ pressed }) => [styles.method, review.method === 'native' ? styles.selectedMethod : null, pressed || actions.configuration?.nativeReady === false ? styles.pressed : null]}><MaterialIcons name="credit-card" size={20} color={review.method === 'native' ? Colors.welcomeDeep : Colors.textSecondary} /><Text style={[styles.methodText, review.method === 'native' ? styles.selectedText : null]}>Carte / Apple / Google Pay</Text></Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: review.method === 'hosted' }} onPress={() => review.setMethod('hosted')} style={({ pressed }) => [styles.method, review.method === 'hosted' ? styles.selectedMethod : null, pressed ? styles.pressed : null]}><MaterialIcons name="open-in-new" size={20} color={review.method === 'hosted' ? Colors.welcomeDeep : Colors.textSecondary} /><Text style={[styles.methodText, review.method === 'hosted' ? styles.selectedText : null]}>TWINT / page Stripe</Text></Pressable>
              </View> : null}
              {review.method === 'hosted' && !actions.hasSubscription ? <Text style={styles.hint}>La page Stripe propose les moyens activés et compatibles avec votre appareil.</Text> : null}
              <Text style={styles.body}>{consent}</Text>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: actions.accepted }} accessibilityLabel={translate('J’accepte le renouvellement automatique.')} onPress={() => actions.setAccepted(!actions.accepted)} style={({ pressed }) => [styles.consent, pressed ? styles.pressed : null]}><MaterialIcons name={actions.accepted ? 'check-box' : 'check-box-outline-blank'} size={24} color={Colors.welcomeDeep} /><Text style={styles.body}>J’accepte le renouvellement automatique.</Text></Pressable>
            </>}
            {review.incompatiblePending ? <Text style={[styles.body, styles.error]}>Terminez ou abandonnez le paiement en attente avant de choisir une autre formule.</Text> : null}
            {review.blockedChange ? <Text style={[styles.body, styles.error]}>{actions.cancellationScheduled ? 'Réactivez le renouvellement avant de programmer un changement.' : 'Régularisez le paiement avant de changer de formule.'}</Text> : null}
            {actions.configurationError ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text style={[styles.body, styles.error, styles.flex]}>{actions.configurationError}</Text></View> : null}
            {!actions.configuration?.catalogReady ? <Pressable accessibilityRole="button" onPress={() => { void actions.checkConfiguration(); }} style={({ pressed }) => [styles.retry, pressed ? styles.pressed : null]}><MaterialIcons name="refresh" size={20} color={Colors.welcomeDeep} /><Text style={styles.retryText}>Vérifier la configuration Stripe</Text></Pressable> : null}
            {actions.error ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={[styles.body, styles.error, styles.flex]}>{actions.error}</Text></View> : null}
          </ScrollView>
          {actions.authenticated && !review.accountLoading ? <View style={styles.footer}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: review.confirmationDisabled, busy: actions.busy || actions.loading }} disabled={review.confirmationDisabled} onPress={review.confirmReview} style={({ pressed }) => [styles.primary, pressed || review.confirmationDisabled ? styles.pressed : null]}>{actions.busy || actions.loading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <MaterialIcons name={summary.changingPlan ? 'event' : 'lock-outline'} size={22} color={Colors.textOnPrimary} />}<Text style={styles.primaryText}>{summary.changingPlan ? 'Confirmer le changement' : 'Continuer vers le paiement'}</Text></Pressable>
          </View> : null}
        </View>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
});
const styles = StyleSheet.create({
  keyboardOverlay: { flex: 1, backgroundColor: Colors.overlay },
  flex: { flex: 1 }, overlay: { flex: 1, backgroundColor: Colors.transparent, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: Spacing.sm },
  sheet: { height: '92%', width: '100%', maxWidth: 600, backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden' },
  header: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }, headerCopy: { flex: 1, gap: Spacing.xs },
  title: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false }, test: { fontSize: Typography.fontSizeSM, color: Colors.welcomeDeep, fontWeight: Typography.weightSemibold },
  close: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.background }, content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.lg },
  summary: { borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.primaryLight, padding: Spacing.md, gap: Spacing.md },
  identity: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: Spacing.md, paddingBottom: Spacing.sm }, planCopy: { flex: 1, minWidth: 100, gap: Spacing.xs }, eyebrow: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  plan: { fontSize: Typography.fontSizeXL, color: Colors.textPrimary, fontWeight: Typography.weightBold }, priceCopy: { alignItems: 'flex-end', gap: Spacing.xs }, amount: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.welcomeDeep }, priceHint: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: Spacing.sm }, rowLabel: { flexGrow: 1, flexBasis: '40%', fontSize: Typography.fontSizeBase, lineHeight: 24, color: Colors.textSecondary }, rowValue: { flexGrow: 1, flexBasis: '48%', textAlign: 'right', fontSize: Typography.fontSizeBase, lineHeight: 24, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  body: { flexShrink: 1, fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, includeFontPadding: false }, hint: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary },
  loading: { gap: Spacing.sm, padding: Spacing.md, alignItems: 'center' }, account: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, email: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textSecondary }, connected: { fontSize: Typography.fontSizeSM, color: Colors.clubDeep, fontWeight: Typography.weightSemibold },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, method: { flexGrow: 1, flexBasis: 140, minHeight: 56, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background }, selectedMethod: { borderColor: Colors.welcomeDeep, backgroundColor: Colors.primaryLight }, methodText: { flexShrink: 1, textAlign: 'center', fontSize: Typography.fontSizeBase, color: Colors.textSecondary }, selectedText: { color: Colors.welcomeDeep, fontWeight: Typography.weightSemibold },
  consent: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm }, feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }, error: { color: Colors.error },
  footer: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }, primary: { minHeight: 56, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.welcomeDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, primaryText: { flexShrink: 1, color: Colors.textOnPrimary, textAlign: 'center', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  retry: { minHeight: 48, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'center' }, retryText: { flexShrink: 1, fontSize: Typography.fontSizeBase, color: Colors.welcomeDeep, fontWeight: Typography.weightSemibold, textAlign: 'center' }, pressed: { opacity: 0.65 },
});
