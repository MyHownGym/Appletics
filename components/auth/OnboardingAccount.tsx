import { memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { BillingAccountForm } from '@/components/auth/BillingAccountForm';
import { useOnboardingAccount } from '@/hooks/useOnboardingAccount';
import type { User } from '@/types';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
interface OnboardingAccountProps { profile: Partial<User>; onComplete: () => void; onBack: () => void }
export const OnboardingAccount = memo(function OnboardingAccount({ profile, onComplete, onBack }: OnboardingAccountProps) {
 const account = useOnboardingAccount(profile, onComplete);
 return <SafeAreaView edges={['top','bottom']} style={styles.screen}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <View style={styles.header}><Pressable accessibilityRole="button" onPress={onBack} disabled={account.busy} style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.title}>Votre compte Appletics</Text></View>
  <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
   <Text style={styles.body}>E-mail et mot de passe permettent de retrouver votre accès si la biométrie ou le code de l’appareil échoue.</Text>
   <BillingAccountForm compact checkout initialRegister />
   {account.error ? <View style={styles.errorRow}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text style={[styles.body, styles.error]}>{account.error}</Text></View> : null}
   {account.authenticated ? <Pressable accessibilityRole="button" disabled={account.busy || account.loading} onPress={() => { void account.complete(); }} style={({ pressed }) => [styles.primary, pressed || account.busy ? styles.pressed : null]}>{account.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : null}<Text style={styles.primaryText}>Continuer avec ce compte</Text></Pressable> : null}
  </ScrollView>
 </KeyboardAvoidingView></SafeAreaView>;
});
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.surface }, back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md }, title: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary }, primary: { minHeight: 56, borderRadius: Radius.lg, backgroundColor: Colors.welcomeDeep, padding: Spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm }, primaryText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary }, errorRow: { flexDirection: 'row', gap: Spacing.sm }, error: { color: Colors.error, flex: 1 }, pressed: { opacity: 0.7 } });
