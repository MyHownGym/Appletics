import { memo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useStartupRecovery } from '@/hooks/useStartupRecovery';
interface StartupOverlayProps { fallback?: boolean }
export const StartupOverlay = memo(function StartupOverlay({ fallback = false }: StartupOverlayProps) {
  const startup = useStartupRecovery();
  if (!fallback && startup.phase === 'ready') return null;
  return <SafeAreaView edges={['top', 'bottom']} style={styles.overlay} onLayout={startup.onLayout}>
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <Image source={require('@/assets/images/appletics-icon.png')} contentFit="contain" transition={200} style={styles.logo} />
        <Text style={styles.brandName}>Appletics</Text>
      </View>
      <View style={styles.panel} accessibilityLiveRegion="polite">
        <View style={styles.headingRow}>
          {startup.blocked ? <MaterialIcons name="error-outline" size={26} color={Colors.error} /> : <ActivityIndicator color={Colors.welcomeDeep} />}
          <Text accessibilityRole="header" style={styles.heading}>{startup.blocked ? startup.copy.blocked : startup.copy.title}</Text>
        </View>
        <Text style={styles.body}>{startup.blocked ? startup.error || startup.copy.slow : startup.copy.waiting}</Text>
        <Text style={styles.stage}>{startup.copy.phase[startup.phase]}</Text>
        <Text selectable style={styles.diagnostic}>{startup.diagnostic}</Text>
        {startup.blocked ? <>
          <Text style={styles.body}>{startup.copy.safe}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={startup.copy.retry} onPress={startup.retry} style={({ pressed }) => [styles.primary, pressed ? styles.pressed : null]}>
            <MaterialIcons name="refresh" size={22} color={Colors.textOnPrimary} /><Text style={styles.primaryText}>{startup.copy.retry}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={startup.copy.support} disabled={startup.supportBusy} onPress={startup.contactSupport} style={({ pressed }) => [styles.secondary, pressed || startup.supportBusy ? styles.pressed : null]}>
            <Text style={styles.secondaryText}>{startup.copy.support}</Text>
          </Pressable>
          {startup.supportFailed ? <Text style={styles.body}>{startup.copy.supportError}</Text> : null}
        </> : null}
      </View>
    </ScrollView>
  </SafeAreaView>;
});
// Component reference for AuthRouter, not an inline JSX element.
export function StartupLoadingScreen() { return <StartupOverlay fallback />; }
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.surface, zIndex: 100 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.lg, gap: Spacing.xl, justifyContent: 'center', width: '100%', maxWidth: 560, alignSelf: 'center' },
  brand: { alignItems: 'center', gap: Spacing.md },
  logo: { width: 80, height: 80, borderRadius: Radius.lg },
  brandName: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false },
  panel: { padding: Spacing.lg, gap: Spacing.md, borderRadius: Radius.xl, backgroundColor: Colors.primaryLight, borderColor: Colors.border, borderWidth: 1 },
  headingRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  heading: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false },
  body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, includeFontPadding: false },
  stage: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.welcomeDeep, fontWeight: Typography.weightSemibold, includeFontPadding: false },
  primary: { minHeight: 48, padding: Spacing.md, gap: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.welcomeDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary, includeFontPadding: false },
  secondary: { minHeight: 48, padding: Spacing.sm, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.welcomeDeep, includeFontPadding: false },
  diagnostic: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary, includeFontPadding: false },
  pressed: { opacity: 0.7 },
});
