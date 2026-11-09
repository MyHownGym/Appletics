import { memo } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { webScroll } from '@/constants/webScroll';
interface AccountDeletionModalProps { visible: boolean; onClose: () => void; }
export const AccountDeletionModal = memo(function AccountDeletionModal({ visible, onClose }: AccountDeletionModalProps) {
  const deletion = useAccountDeletion(visible, onClose);
  const { translate } = useLocalizedCopy();
  return <Modal visible={visible} animationType="slide" onRequestClose={() => { if (!deletion.busy) onClose(); }}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}><Text style={styles.title}>Supprimer mon compte</Text><Pressable disabled={deletion.busy} accessibilityRole="button" accessibilityLabel={translate('Annuler')} onPress={onClose} style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]}><MaterialIcons name="close" size={24} color={Colors.textPrimary} /></Pressable></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={[styles.flex, webScroll]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.warning}><MaterialIcons name="delete-forever" size={32} color={Colors.error} /><Text style={styles.heading}>Suppression irréversible</Text><Text style={styles.body}>Votre connexion, votre profil, vos données privées Cloud et l’historique de ce compte sur cet appareil seront supprimés. Votre abonnement éventuel sera résilié immédiatement, sans nouveau prélèvement.</Text></View>
          <Text style={styles.body}>Les groupes dont vous êtes propriétaire seront supprimés pour tous leurs membres. Dans les groupes d’autres coachs, certaines contributions sportives resteront sans votre nom, e-mail ou profil, avec une référence technique anonymisée.</Text>
          <Text style={styles.body}>La suppression locale ne peut pas effacer les exports ou les copies déjà enregistrées sur d’autres appareils.</Text>
          <Text style={styles.label}>Mot de passe actuel</Text><PasswordInput accessibilityLabel={translate('Mot de passe actuel')} value={deletion.password} onChangeText={deletion.setPassword} editable={!deletion.busy} autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="current-password" maxLength={256} style={styles.input} />
          <Pressable disabled={deletion.busy} accessibilityRole="checkbox" accessibilityState={{ checked: deletion.accepted }} accessibilityLabel={translate('Je comprends et confirme la suppression définitive.')} onPress={() => deletion.setAccepted(!deletion.accepted)} style={({ pressed }) => [styles.confirm, pressed ? styles.pressed : null]}><MaterialIcons name={deletion.accepted ? 'check-box' : 'check-box-outline-blank'} size={26} color={Colors.error} /><Text style={[styles.body, styles.flex]}>Je comprends et confirme la suppression définitive.</Text></Pressable>
          {deletion.error ? <View accessibilityLiveRegion="polite" style={styles.errorRow}><MaterialIcons name="error-outline" size={24} color={Colors.error} /><Text style={styles.error}>{deletion.error}</Text></View> : null}
          <Pressable disabled={deletion.busy || !deletion.accepted || !deletion.password} accessibilityRole="button" accessibilityLabel={translate('Supprimer définitivement')} onPress={deletion.erase} style={({ pressed }) => [styles.erase, deletion.busy || !deletion.accepted || !deletion.password ? styles.disabled : null, pressed ? styles.pressed : null]}>{deletion.busy ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={styles.eraseText}>Supprimer définitivement</Text>}</Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border }, title: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary }, close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: Radius.md }, content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl }, warning: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm }, heading: { fontSize: Typography.fontSizeMD, color: Colors.error, fontWeight: Typography.weightBold }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, includeFontPadding: false }, label: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary }, input: { minHeight: 52, padding: Spacing.md, backgroundColor: Colors.surface, color: Colors.textPrimary, fontSize: Typography.fontSizeBase, borderWidth: 1, borderColor: Colors.textSecondary, borderRadius: Radius.md }, confirm: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', minHeight: 48 }, errorRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }, error: { flex: 1, color: Colors.error, fontSize: Typography.fontSizeBase, lineHeight: 26 }, erase: { minHeight: 52, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' }, eraseText: { color: Colors.textOnPrimary, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.7 },
});
