import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useCallback, useEffect } from 'react';
import { consumeStartupUnlock } from '@/services/sessionLock';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useLoginUnlock } from '@/hooks/useLoginUnlock';
import { BillingAccountForm } from '@/components/auth/BillingAccountForm';
import { AccountUnlockForm } from '@/components/auth/AccountUnlockForm';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
export default function LoginScreen() {
 const lock = useLoginUnlock(); const auth = useAuth(); const { setLocked } = useApp(); const { t } = useI18n();
 const connected = !!auth.user; const enabled = connected && !!lock.user.biometricEnabled;
 const onSignedIn = useCallback((_userId: string) => setLocked(false), [setLocked]);
 useEffect(() => {
  if (!connected || lock.loading) return;
  if (consumeStartupUnlock() && !lock.user.biometricEnabled) setLocked(false);
 }, [connected, lock.loading, lock.user.biometricEnabled, setLocked]);
 return <SafeAreaView style={styles.screen} edges={['top','bottom']}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
  <Image source={require('@/assets/images/appletics-icon.png')} contentFit="contain" transition={200} style={styles.logo} /><Text style={styles.title}>{connected ? 'Bon retour,' : 'Votre compte Appletics'}</Text>{connected ? <Text verbatim style={styles.name}>{lock.user.name}</Text> : null}
  {connected ? <View style={styles.panel}>
   <Text style={styles.heading}>{enabled ? 'Session verrouillée' : 'Retour à Appletics'}</Text>
   {lock.loading ? <ActivityIndicator color={Colors.welcomeDeep} /> : enabled ? <>
    {lock.capabilities.available ? <Pressable disabled={lock.busy} onPress={() => { void lock.requestUnlock(false); }} style={({ pressed }) => [styles.primary,pressed || lock.busy ? styles.pressed : null]}>{lock.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : <MaterialIcons name={lock.capabilities.type === 'face' ? 'face' : 'fingerprint'} size={26} color={Colors.textOnPrimary} />}<Text style={styles.primaryText}>{`${t('Continuer avec')} ${lock.capabilities.label}`}</Text></Pressable> : <Text style={styles.body}>{lock.capabilities.reason || t('La biométrie n’est pas disponible sur cet appareil.')}</Text>}
    {lock.capabilities.deviceFallbackAvailable ? <Pressable disabled={lock.busy} onPress={() => { void lock.requestUnlock(true); }} style={({ pressed }) => [styles.secondary,pressed || lock.busy ? styles.pressed : null]}><MaterialIcons name="dialpad" size={22} color={Colors.welcomeDeep} /><Text style={styles.secondaryText}>Code de l’appareil (secours)</Text></Pressable> : null}
   </> : <Pressable onPress={lock.continueWithoutBiometrics} style={({ pressed }) => [styles.primary,pressed ? styles.pressed : null]}><Text style={styles.primaryText}>Continuer</Text><MaterialIcons name="arrow-forward" size={22} color={Colors.textOnPrimary} /></Pressable>}
   {lock.message ? <View style={styles.feedback}><MaterialIcons name={lock.failed ? 'error-outline' : 'check-circle-outline'} size={22} color={lock.failed ? Colors.error : Colors.clubDeep} /><Text style={[styles.body,lock.failed ? styles.error : null]}>{lock.message}</Text></View> : null}
  </View> : null}
  {connected ? <AccountUnlockForm /> : <BillingAccountForm compact checkout onSignedIn={onSignedIn} />}
  {Platform.OS !== 'web' ? <Text style={styles.body}>E-mail et mot de passe permettent de retrouver votre accès si la biométrie ou le code de l’appareil échoue.</Text> : null}
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.surface }, flex: { flex: 1 }, content: { width: '100%',maxWidth: 500,alignSelf: 'center',flexGrow: 1,padding: Spacing.md,paddingVertical: Spacing.xl,gap: Spacing.lg,justifyContent: 'center' }, logo: { width: 56,height: 56,borderRadius: Radius.md,alignSelf: 'center' }, title: { fontSize: Typography.fontSizeLG,fontWeight: Typography.weightBold,color: Colors.textPrimary,textAlign: 'center' }, name: { fontSize: Typography.fontSizeXL,fontWeight: Typography.weightBold,color: Colors.textPrimary,textAlign: 'center' }, heading: { fontSize: Typography.fontSizeMD,fontWeight: Typography.weightSemibold,color: Colors.textPrimary }, panel: { padding: Spacing.md,borderRadius: Radius.xl,borderWidth: 1,borderColor: Colors.border,backgroundColor: Colors.background,gap: Spacing.md }, body: { fontSize: Typography.fontSizeBase,lineHeight: 26,color: Colors.textSecondary,flexShrink: 1,includeFontPadding: false }, primary: { minHeight: 56,padding: Spacing.md,borderRadius: Radius.lg,backgroundColor: Colors.welcomeDeep,flexDirection: 'row',alignItems: 'center',justifyContent: 'center',gap: Spacing.sm }, primaryText: { fontSize: Typography.fontSizeBase,fontWeight: Typography.weightSemibold,color: Colors.textOnPrimary,flexShrink: 1,textAlign: 'center' }, secondary: { minHeight: 48,padding: Spacing.md,borderRadius: Radius.md,backgroundColor: Colors.surface,borderWidth: 1,borderColor: Colors.border,flexDirection: 'row',gap: Spacing.sm,alignItems: 'center',justifyContent: 'center' }, secondaryText: { fontSize: Typography.fontSizeBase,fontWeight: Typography.weightSemibold,color: Colors.welcomeDeep,flexShrink: 1 }, feedback: { flexDirection: 'row',gap: Spacing.sm }, error: { color: Colors.error }, pressed: { opacity: 0.7 } });
