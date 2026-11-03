import { memo } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useAccountUnlock } from '@/hooks/useAccountUnlock';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface AccountUnlockFormProps {}
export const AccountUnlockForm = memo(function AccountUnlockForm(_props: AccountUnlockFormProps) {
 const form = useAccountUnlock(); const { translate } = useLocalizedCopy();
 return <View style={styles.panel}><Text style={styles.title}>Connexion de secours</Text><Text verbatim style={styles.body}>{form.email}</Text><Text style={styles.label}>Mot de passe</Text>
 <TextInput accessibilityLabel={translate('Mot de passe')} value={form.password} onChangeText={form.setPassword} secureTextEntry autoComplete="current-password" autoCapitalize="none" editable={!form.busy} returnKeyType="go" onSubmitEditing={() => { Keyboard.dismiss(); void form.unlock(); }} style={styles.input} />
 <Pressable disabled={form.busy || !form.password} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); void form.unlock(); }} style={({ pressed }) => [styles.button, pressed || form.busy ? styles.pressed : null]}>{form.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : null}<Text style={styles.buttonText}>Se connecter avec mon mot de passe</Text></Pressable>
 {form.error ? <View style={styles.errorRow}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={[styles.body, styles.error]}>{form.error}</Text></View> : null}</View>;
});
const styles = StyleSheet.create({ panel: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.sm }, title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary }, label: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary }, input: { minHeight: 52, borderWidth: 1, borderColor: Colors.textSecondary, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.fontSizeBase, color: Colors.textPrimary, backgroundColor: Colors.background }, button: { minHeight: 56, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, justifyContent: 'center', alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.welcomeDeep }, buttonText: { flexShrink: 1, fontSize: Typography.fontSizeBase, color: Colors.textOnPrimary, fontWeight: Typography.weightSemibold, textAlign: 'center' }, errorRow: { flexDirection: 'row', gap: Spacing.sm }, error: { color: Colors.error, flex: 1 }, pressed: { opacity: 0.7 } });
