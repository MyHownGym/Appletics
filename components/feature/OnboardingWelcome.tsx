import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '@/hooks/useI18n';
import { useWelcomeLayout } from '@/hooks/useWelcomeLayout';
import { onboardingCopy } from '@/constants/onboarding';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { OnboardingHighlights } from '@/components/feature/OnboardingHighlights';
interface OnboardingWelcomeProps { onContinue: () => void; onSignIn?: () => void }

// Fixed safe-area composition: the artwork absorbs size changes, never the CTA.
export const OnboardingWelcome = memo(function OnboardingWelcome({ onContinue, onSignIn }: OnboardingWelcomeProps) {
  const { language } = useI18n();
  const layout = useWelcomeLayout();
  const copy = onboardingCopy[language];
  const [frenchSlogan, germanSlogan, italianSlogan] = copy.headline.split('\n');
  return <LinearGradient colors={[Colors.welcomeOrange, Colors.welcomeDeep]} style={styles.screen}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={[styles.content, { paddingHorizontal: layout.horizontal, paddingVertical: layout.landscape ? Spacing.sm : layout.padding, gap: layout.gap }]}>
        <View style={styles.brandRow}>
          <View style={styles.brand}><Image source={require('@/assets/images/appletics-icon.png')} contentFit="contain" transition={200} style={[styles.logo, { width: layout.logoSize, height: layout.logoSize }]} /><Text maxFontSizeMultiplier={1.2} style={styles.brandName}>Appletics</Text></View>
          {layout.landscape ? <Text numberOfLines={1} adjustsFontSizeToFit style={styles.headerAudience}>{copy.footer}</Text> : null}
        </View>
        <View style={[styles.hero, { gap: layout.gap }, layout.landscape ? styles.heroWide : null]}>
          <View style={[styles.words, { gap: layout.landscape ? Spacing.xs : layout.compact ? Spacing.sm : Spacing.md }, layout.landscape ? styles.wordsWide : null]}>
            <View style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2} style={styles.eyebrow}>{copy.eyebrow}</Text></View>
            <View style={styles.slogans} accessible accessibilityRole="header" accessibilityLabel={copy.headline.replace(/\n/g, ' ')}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.1} style={[styles.headline, { fontSize: layout.headlineSize, lineHeight: layout.headlineSize * Typography.lineHeightHeading }]}>{frenchSlogan}</Text>
              <View style={styles.translations}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={styles.translation}>{germanSlogan}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={styles.translation}>{italianSlogan}</Text></View>
            </View>
            <Text maxFontSizeMultiplier={1.15} style={[styles.description, layout.landscape ? styles.descriptionLandscape : null]}>{copy.description}</Text>
          </View>
          <View style={[styles.visual, { gap: layout.compact ? Spacing.sm : Spacing.md }, layout.landscape ? styles.visualWide : null]}>
            <View style={[styles.track, { maxHeight: layout.trackHeight }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.trackInner} /><View style={styles.laneOne} /><View style={styles.laneTwo} /><View style={styles.laneThree} />
              {layout.trackHeight >= 80 ? <View style={styles.trackMark}><MaterialIcons name="north-east" size={24} color={Colors.welcomeText} /><Text style={styles.trackBrand}>APPLETICS</Text></View> : null}
              {layout.trackHeight >= 64 ? <View style={styles.laneNumbers}><Text style={styles.laneNumber}>01</Text><Text style={styles.laneNumber}>02</Text><Text style={styles.laneNumber}>03</Text></View> : null}
            </View>
            <OnboardingHighlights compact={layout.compact || layout.landscape} training={copy.training} progress={copy.progress} team={copy.team} />
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.continue} onPress={onContinue} style={({ pressed }) => [styles.button, layout.landscape ? styles.buttonLandscape : null, pressed ? styles.pressed : null]}><Text maxFontSizeMultiplier={1.2} style={styles.buttonText}>{copy.continue}</Text><MaterialIcons name="arrow-forward" size={22} color={Colors.welcomeInk} /></Pressable>
          {onSignIn ? <Pressable accessibilityRole="button" onPress={onSignIn} style={({ pressed }) => [styles.signIn, pressed ? styles.pressed : null]}><Text maxFontSizeMultiplier={1.2} style={styles.signInText}>{copy.signIn}</Text></Pressable> : null}
          {!layout.landscape ? <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2} style={styles.audience}>{copy.footer}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  </LinearGradient>;
});
const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, flexShrink: 0 }, brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logo: { borderRadius: Radius.md }, brandName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, letterSpacing: -0.5, color: Colors.textOnPrimary, includeFontPadding: false }, headerAudience: { flexShrink: 1, fontSize: Typography.fontSizeBase, color: Colors.welcomeText },
  hero: { flex: 1, minHeight: 1, justifyContent: 'center' }, heroWide: { flexDirection: 'row', alignItems: 'stretch' }, words: { minWidth: 1, flexShrink: 0 }, wordsWide: { flex: 1, justifyContent: 'center', maxWidth: 460 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, eyebrowLine: { width: Spacing.lg, height: 2, backgroundColor: Colors.welcomeText }, eyebrow: { flex: 1, fontSize: Typography.fontSizeSM, lineHeight: 21, fontWeight: Typography.weightSemibold, letterSpacing: 1.2, color: Colors.welcomeText, includeFontPadding: false },
  slogans: { gap: Spacing.sm }, headline: { fontWeight: Typography.weightBold, letterSpacing: -0.5, color: Colors.textOnPrimary, includeFontPadding: false }, translations: { gap: Spacing.xs }, translation: { fontSize: Typography.fontSizeBase, lineHeight: 24, fontWeight: Typography.weightRegular, fontStyle: 'italic', color: Colors.welcomeText, includeFontPadding: false },
  description: { maxWidth: 460, fontSize: Typography.fontSizeBase, lineHeight: Typography.fontSizeBase * Typography.lineHeightBody, color: Colors.welcomeText, includeFontPadding: false }, descriptionLandscape: { lineHeight: 22 },
  visual: { flex: 1, minHeight: 1, justifyContent: 'center' }, visualWide: { flex: 1, maxWidth: 400 },
  track: { flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', position: 'relative', borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.welcomeLine, backgroundColor: Colors.welcomePanel },
  trackInner: { position: 'absolute', top: 68, bottom: -140, left: 136, right: -80, borderRadius: 180, borderWidth: 2, borderColor: Colors.welcomeLine }, laneOne: { position: 'absolute', top: 36, bottom: -172, left: 104, right: -112, borderRadius: 220, borderWidth: 2, borderColor: Colors.welcomeLine }, laneTwo: { position: 'absolute', top: 4, bottom: -204, left: 72, right: -144, borderRadius: 250, borderWidth: 2, borderColor: Colors.welcomeLine }, laneThree: { position: 'absolute', top: -28, bottom: -236, left: 40, right: -176, borderRadius: 280, borderWidth: 2, borderColor: Colors.welcomeLine },
  trackMark: { position: 'absolute', top: Spacing.md, left: Spacing.md, gap: Spacing.xs }, trackBrand: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, letterSpacing: 2, color: Colors.welcomeText, includeFontPadding: false }, laneNumbers: { position: 'absolute', bottom: Spacing.md, right: Spacing.md, flexDirection: 'row', gap: Spacing.lg }, laneNumber: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.weightSemibold, fontStyle: 'italic', color: Colors.welcomeText, includeFontPadding: false },
  footer: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: Spacing.sm, flexShrink: 0 }, audience: { fontSize: Typography.fontSizeBase, lineHeight: 24, textAlign: 'center', color: Colors.welcomeText, includeFontPadding: false },
  signIn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md }, signInText: { color: Colors.welcomeText, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, textDecorationLine: 'underline' },
  button: { minHeight: 56, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.welcomeText, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.md }, buttonLandscape: { minHeight: 48, paddingVertical: Spacing.sm }, buttonText: { flexShrink: 1, color: Colors.welcomeInk, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, textAlign: 'center', includeFontPadding: false }, pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
