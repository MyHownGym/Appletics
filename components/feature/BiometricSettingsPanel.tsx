import { memo } from 'react';
import { View, Switch, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import type { useBiometricSettings } from '@/hooks/useBiometricSettings';

interface BiometricSettingsPanelProps { biometric: ReturnType<typeof useBiometricSettings> }
export const BiometricSettingsPanel = memo(function BiometricSettingsPanel({ biometric }: BiometricSettingsPanelProps) {
  const { capabilities, loading, busy, enabled, message, failed } = biometric;
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <MaterialIcons name={capabilities.type === 'face' ? 'face' : 'fingerprint'} size={26} color={Colors.success} />
        <View style={styles.info}><Text style={styles.title}>{capabilities.label}</Text><Text style={styles.body}>{enabled ? 'Activé · biométrie prioritaire, code de l’appareil en secours' : 'Activer le déverrouillage biométrique'}</Text></View>
        {loading || busy ? <ActivityIndicator color={Colors.primary} /> : <Switch accessibilityLabel={`Activer ${capabilities.label}`} value={enabled} disabled={!capabilities.available && !enabled} onValueChange={() => { void biometric.toggle(); }} trackColor={{ false: Colors.border, true: Colors.success }} thumbColor={Colors.surface} />}
      </View>
      {capabilities.reason ? <Text style={styles.body}>{capabilities.reason}</Text> : null}
      {Platform.OS === 'ios' ? <Text style={styles.body}>Autorisez Face ID dans Réglages iOS &gt; Appletics. L’autorisation ajoutée nécessite un nouveau build iOS installé ; un simple rechargement de l’aperçu ne suffit pas. Face ID ne fonctionne pas dans Expo Go.</Text> : null}
      {message ? <View style={styles.feedback}><MaterialIcons name={failed ? 'error-outline' : 'check-circle-outline'} size={20} color={failed ? Colors.error : Colors.success} /><Text accessibilityLiveRegion="polite" style={[styles.body, { color: failed ? Colors.error : Colors.success }]}>{message}</Text></View> : null}
      <View style={styles.actions}>
        {capabilities.available ? <Pressable disabled={busy || loading} onPress={biometric.test} style={({ pressed }) => [styles.button, pressed || busy ? styles.pressed : null]}><MaterialIcons name="verified-user" size={20} color={Colors.primary} /><Text style={styles.link}>Tester {capabilities.label}</Text></Pressable> : null}
        <Pressable disabled={busy || loading} onPress={() => { void biometric.refresh(); }} style={({ pressed }) => [styles.button, pressed || busy ? styles.pressed : null]}><MaterialIcons name="refresh" size={20} color={Colors.primary} /><Text style={styles.link}>Vérifier l’appareil</Text></Pressable>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  panel: { padding: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  info: { flex: 1, gap: Spacing.xs },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, includeFontPadding: false },
  body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, flexShrink: 1, includeFontPadding: false },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  button: { minHeight: 48, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  link: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.primary, flexShrink: 1 },
  pressed: { opacity: 0.65 },
});
