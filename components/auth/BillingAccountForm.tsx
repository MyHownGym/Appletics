import { memo } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet, Keyboard, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useBillingAccount } from '@/hooks/useBillingAccount';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
interface BillingAccountFormProps { compact?: boolean; checkout?: boolean; initialRegister?: boolean; onSignedIn?: (userId: string) => void }
export const BillingAccountForm = memo(function BillingAccountForm({ compact = false, checkout = false, initialRegister = false, onSignedIn }: BillingAccountFormProps) {
  const account = useBillingAccount(initialRegister, onSignedIn);
  const { translate } = useLocalizedCopy();
  return <View style={styles.panel}>
    <View style={styles.heading}><MaterialIcons name="verified-user" size={24} color={Colors.welcomeDeep} /><Text style={styles.title}>{checkout ? 'Compte Appletics' : 'Compte sécurisé'}</Text></View>
    {account.loading ? <ActivityIndicator color={Colors.welcomeDeep} /> : account.user ? <>
      <Text verbatim style={styles.body}>{account.user.email}</Text>
      {!compact ? <Text style={styles.body}>Cet abonnement test est rattaché à votre compte, pas au nom du profil local.</Text> : null}
      <Pressable disabled={account.busy} accessibilityRole="button" onPress={() => { void account.logout(); }} style={({ pressed }) => [styles.secondary, pressed || account.busy ? styles.pressed : null]}><Text style={styles.secondaryText}>Se déconnecter du compte</Text></Pressable>
    </> : <>
      {account.reset ? <>
        <Text style={styles.heading2}>Mot de passe oublié</Text>
        <Text style={styles.body}>{account.codeSent ? 'Saisissez le code reçu par e-mail et choisissez un nouveau mot de passe.' : 'Indiquez l’e-mail de votre compte : vous recevrez un code pour choisir un nouveau mot de passe.'}</Text>
        <Text style={styles.label}>Adresse e-mail</Text><TextInput accessibilityLabel={translate('Adresse e-mail')} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" value={account.email} onChangeText={account.setEmail} editable={!account.busy && !account.codeSent} style={styles.input} placeholder="coach@example.com" placeholderTextColor={Colors.textSecondary} />
        {account.codeSent ? <>
          <Text style={styles.label}>Code reçu par e-mail</Text><TextInput accessibilityLabel={translate('Code reçu par e-mail')} keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} value={account.otp} onChangeText={account.setOtp} editable={!account.busy} style={styles.input} />
          <Text style={styles.label}>Nouveau mot de passe</Text><PasswordInput accessibilityLabel={translate('Nouveau mot de passe')} autoComplete="new-password" value={account.password} onChangeText={account.setPassword} editable={!account.busy} style={styles.input} />
          <Text style={styles.label}>Confirmer le mot de passe</Text><PasswordInput accessibilityLabel={translate('Confirmer le mot de passe')} autoComplete="new-password" value={account.confirmation} onChangeText={account.setConfirmation} editable={!account.busy} style={styles.input} />
        </> : null}
        <Pressable disabled={account.busy} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); void account.submit(); }} style={({ pressed }) => [styles.primary, pressed || account.busy ? styles.pressed : null]}>{account.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : null}<Text style={styles.primaryText}>{account.codeSent ? 'Changer mon mot de passe' : 'Recevoir un code'}</Text></Pressable>
        <Pressable disabled={account.busy} accessibilityRole="button" onPress={account.cancelReset} style={({ pressed }) => [styles.secondary, pressed || account.busy ? styles.pressed : null]}><Text style={styles.secondaryText}>Retour à la connexion</Text></Pressable>
      </> : <>
      <Text style={styles.body}>{checkout ? (account.register ? 'Créez votre compte Appletics : un code de vérification vous sera envoyé par e-mail.' : 'Connectez-vous avec l’e-mail et le mot de passe de votre compte Appletics.') : 'Connectez-vous ou créez un compte pour gérer votre abonnement.'}</Text>
      <Text style={styles.label}>Adresse e-mail</Text><TextInput accessibilityLabel={translate('Adresse e-mail')} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" value={account.email} onChangeText={account.setEmail} editable={!account.busy && !account.codeSent} style={styles.input} placeholder="coach@example.com" placeholderTextColor={Colors.textSecondary} />
      <Text style={styles.label}>Mot de passe</Text><PasswordInput accessibilityLabel={translate('Mot de passe')} autoCapitalize="none" autoComplete={account.register ? 'new-password' : 'current-password'} value={account.password} onChangeText={account.setPassword} editable={!account.busy && !account.codeSent} style={styles.input} />
      {!account.register ? <Pressable disabled={account.busy} accessibilityRole="link" onPress={account.startReset} style={({ pressed }) => [styles.forgot, pressed ? styles.pressed : null]}><Text style={styles.forgotText}>Mot de passe oublié ?</Text></Pressable> : null}
      {account.register ? <><Text style={styles.label}>Confirmer le mot de passe</Text><PasswordInput accessibilityLabel={translate('Confirmer le mot de passe')} value={account.confirmation} onChangeText={account.setConfirmation} editable={!account.busy && !account.codeSent} style={styles.input} /></> : null}
      {account.codeSent ? <><Text style={styles.label}>Code reçu par e-mail</Text><TextInput accessibilityLabel={translate('Code reçu par e-mail')} keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} value={account.otp} onChangeText={account.setOtp} editable={!account.busy} style={styles.input} /></> : null}
      {Platform.OS !== 'web' ? <Pressable accessibilityRole="button" accessibilityLabel={translate('Fermer le clavier')} onPress={Keyboard.dismiss} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}><MaterialIcons name="keyboard-hide" size={22} color={Colors.textSecondary} /><Text style={styles.secondaryText}>Fermer le clavier</Text></Pressable> : null}
      <Pressable disabled={account.busy} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); void account.submit(); }} style={({ pressed }) => [styles.primary, pressed || account.busy ? styles.pressed : null]}>{account.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : null}<Text style={styles.primaryText}>{account.register ? account.codeSent ? 'Vérifier et créer mon compte' : 'Recevoir le code de vérification' : 'Se connecter'}</Text></Pressable>
      <Pressable disabled={account.busy} accessibilityRole="button" onPress={account.toggleMode} style={({ pressed }) => [styles.secondary, pressed || account.busy ? styles.pressed : null]}><Text style={styles.secondaryText}>{account.register ? 'J’ai déjà un compte' : 'Créer un compte'}</Text></Pressable>
      </>}
    </>}
    {account.error ? <View style={styles.feedback}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={[styles.body, styles.error]}>{account.error}</Text></View> : null}
    {account.message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{account.message}</Text> : null}
  </View>;
});
const styles = StyleSheet.create({
  panel: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold },
  body: { flexShrink: 1, color: Colors.textSecondary, fontSize: Typography.fontSizeBase, lineHeight: 26, includeFontPadding: false }, label: { marginTop: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold },
  heading2: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  forgot: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' },
  forgotText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.welcomeDeep, textDecorationLine: 'underline' },
  input: { minHeight: 52, borderWidth: 1, borderColor: Colors.textSecondary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.fontSizeBase, color: Colors.textPrimary, backgroundColor: Colors.background, includeFontPadding: false },
  primary: { minHeight: 52, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.welcomeDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  primaryText: { color: Colors.textOnPrimary, textAlign: 'center', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, flexShrink: 1 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primaryLight }, secondaryText: { color: Colors.welcomeDeep, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }, error: { color: Colors.error, flex: 1 }, pressed: { opacity: 0.7 },
});
