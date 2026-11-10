import { useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useI18n } from '@/hooks/useI18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { billingOptions } from '@/constants/subscriptionPricing';
import { useSubscriptionOffers } from '@/hooks/useSubscriptionOffers';
import { useResponsive } from '@/hooks/useResponsive';
import { SubscriptionFeatures } from '@/components/feature/SubscriptionFeatures';
import { SubscriptionDisclosure } from '@/components/feature/SubscriptionDisclosure';
import { SubscriptionCapacityPreview } from '@/components/feature/SubscriptionCapacityPreview';
import { AppBrand } from '@/components/feature/AppBrand';
import { BillingStatusPanel } from '@/components/feature/BillingStatusPanel';
import { BillingPaymentActions } from '@/components/feature/BillingPaymentActions';
import { BillingTestGuide } from '@/components/feature/BillingTestGuide';
import { BetaBillingScreen } from '@/components/feature/BetaBillingScreen';
import { TrialBanner } from '@/components/feature/TrialBanner';
import { useReleasePolicy } from '@/hooks/useReleasePolicy';
import { useBilling } from '@/hooks/useBilling';

export default function UpgradeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const offer = useSubscriptionOffers();
  const { screenPadding } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);
  const release = useReleasePolicy();
  const testMode = useBilling().configuration?.testMode === true;
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [offer.focusId]);
  if (offer.isAthlete) return <Redirect href="/(tabs)/profile" />;
  if (!release.externalBillingAllowed) return <BetaBillingScreen currentLabel={offer.currentLabel} />;
  const { plan, price } = offer;
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.headerTitle}>Abonnement</Text><AppBrand compact /></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" ref={scrollRef} style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingHorizontal: screenPadding }]}>
        <View style={styles.intro}><View style={styles.introTop}><Text style={styles.eyebrow}>{offer.isClub ? 'POUR VOTRE CLUB' : 'POUR VOTRE COACHING'}</Text>{testMode ? <Text style={styles.testBadge}>TEST</Text> : null}</View><Text style={styles.title}>Choisissez votre formule.</Text><Text style={styles.current}>{`Formule actuelle : ${offer.currentLabel}`}</Text></View>
        <TrialBanner horizontalPadding={0} />
        {offer.reason ? <View style={styles.reason}><MaterialIcons name="lock-outline" size={20} color={Colors.welcomeDeep} /><Text style={styles.reasonText}>{offer.reason}</Text></View> : null}
        <View style={styles.tabs}>{offer.tiers.map(item => {
          const selected = item.id === plan.id;
          return <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.name} onPress={() => offer.setSelected(item.id)} style={({ pressed }) => [styles.tab, selected ? styles.selectedTab : null, pressed ? styles.pressed : null]}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabText, selected ? styles.selectedText : null]}>{item.name.replace('Club ', '')}</Text></Pressable>;
        })}</View>
        <View style={styles.billing}>{billingOptions.map(option => {
          const selected = offer.billing === option.id;
          return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${t(option.label)} · ${t(option.detail)}`} onPress={() => offer.setBilling(option.id)} style={({ pressed }) => [styles.billingOption, selected ? styles.selectedBilling : null, pressed ? styles.pressed : null]}><Text style={[styles.billingLabel, selected ? styles.selectedText : null]}>{option.label}</Text><Text style={styles.billingDetail}>{option.detail}</Text></Pressable>;
        })}</View>
        <LinearGradient colors={plan.gradient ?? [plan.color, plan.color]} style={styles.priceCard}>
          <View style={styles.priceTop}><View style={styles.priceIdentity}><Text verbatim style={styles.planName}>{plan.name}</Text><Text style={styles.planSubtitle}>{plan.subtitle}</Text></View><View style={styles.priceBox}><Text verbatim style={styles.price}>{price.amountText}</Text><Text style={styles.priceUnit}>{price.unit}</Text></View></View>
          <SubscriptionCapacityPreview plan={plan} />
        </LinearGradient>
        <BillingPaymentActions key={`${plan.id}:${offer.billing}`} tier={plan.id} cycle={offer.billing} name={plan.name} />
        <SubscriptionDisclosure title="Voir toutes les fonctionnalités">
          <SubscriptionFeatures rows={offer.rows} color={plan.color} />
          {offer.isClub ? <View style={styles.notice}><MaterialIcons name="admin-panel-settings" size={22} color={Colors.clubDeep} /><Text style={styles.body}>Les places comité sont prévues dans l’offre. Les comptes partagés et permissions distantes ne sont pas encore connectés.</Text></View> : null}
          <Text style={styles.detailNote}>Votre historique reste conservé si vous choisissez une formule plus petite. Seule la création au-delà des quotas est bloquée ; vous pouvez toujours modifier vos données.</Text>
        </SubscriptionDisclosure>
        <SubscriptionDisclosure title={testMode ? 'Aide et tests Stripe' : 'Paiement et abonnement'}>
          <BillingStatusPanel />
          {testMode ? <BillingTestGuide /> : null}
        </SubscriptionDisclosure>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  back: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }, headerTitle: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
  intro: { gap: Spacing.sm }, introTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'space-between' }, eyebrow: { color: Colors.welcomeDeep, fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, letterSpacing: 1 },
  title: { color: Colors.textPrimary, fontSize: Typography.fontSizeXL, lineHeight: 30, fontWeight: Typography.weightBold, includeFontPadding: false }, current: { color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 24 }, testBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, color: Colors.welcomeDeep, fontWeight: Typography.weightBold, fontSize: Typography.fontSizeSM },
  reason: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.sm, backgroundColor: Colors.primaryLight }, reasonText: { flex: 1, fontSize: Typography.fontSizeBase, lineHeight: 24, color: Colors.welcomeDeep },
  tabs: { flexDirection: 'row', gap: Spacing.sm }, tab: { flex: 1, minWidth: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: Radius.md }, selectedTab: { backgroundColor: Colors.primaryLight, borderColor: Colors.welcomeDeep }, tabText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, flexShrink: 1 }, selectedText: { color: Colors.welcomeDeep },
  billing: { flexDirection: 'row', gap: Spacing.sm }, billingOption: { flex: 1, minWidth: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface, padding: Spacing.sm, gap: Spacing.xs }, selectedBilling: { backgroundColor: Colors.primaryLight, borderColor: Colors.welcomeDeep }, billingLabel: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, fontWeight: Typography.weightSemibold, textAlign: 'center' }, billingDetail: { fontSize: Typography.fontSizeSM, lineHeight: 18, color: Colors.textSecondary, textAlign: 'center' },
  priceCard: { borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.md }, priceTop: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: Spacing.md }, priceIdentity: { flex: 1, minWidth: 100, gap: Spacing.sm }, planName: { fontSize: Typography.fontSizeXL, color: Colors.textOnPrimary, fontWeight: Typography.weightBold }, planSubtitle: { fontSize: Typography.fontSizeBase, lineHeight: 24, color: Colors.welcomeText }, priceBox: { alignItems: 'flex-end', gap: Spacing.xs }, price: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.weightBold, color: Colors.textOnPrimary }, priceUnit: { fontSize: Typography.fontSizeBase, color: Colors.welcomeText },
  notice: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radius.md }, body: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 26 }, detailNote: { padding: Spacing.sm, color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 26 }, pressed: { opacity: 0.7 },
});
