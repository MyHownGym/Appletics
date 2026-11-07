import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { enablePush, getPushState, type PushState } from '@/services/pushService';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// Invitation to turn on message notifications (hidden once they are on or when unavailable).
export const PushNotificationsPrompt = memo(function PushNotificationsPrompt() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { let alive = true; void getPushState().then(value => { if (alive) setState(value); }); return () => { alive = false; }; }, []);
  const enable = useCallback(async () => {
    setBusy(true); setError('');
    try { setState(await enablePush()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Activation impossible.'); }
    finally { setBusy(false); }
  }, []);
  if (!state || state === 'on' || state === 'unsupported') return null;
  const text = state === 'needs-install'
    ? 'Pour recevoir les notifications sur iPhone : touchez Partager puis « Sur l’écran d’accueil », et ouvrez Appletics depuis l’icône.'
    : state === 'denied'
      ? 'Les notifications sont bloquées pour Appletics. Autorisez-les dans les réglages du navigateur.'
      : 'Soyez prévenu quand un membre de vos groupes vous écrit.';
  return <View style={styles.card}>
    <MaterialIcons name="notifications-active" size={24} color={Colors.primary} />
    <View style={styles.text}>
      <Text style={styles.title}>Notifications des messages</Text>
      <Text style={styles.body}>{text}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
    {state === 'off' ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void enable(); }} style={({ pressed }) => [styles.button, pressed || busy ? styles.pressed : null]}>
      {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Activer</Text>}
    </Pressable> : null}
  </View>;
});
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  text: { flex: 1, gap: 2 },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  body: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  error: { fontSize: Typography.fontSizeSM, color: Colors.error },
  button: { minHeight: 44, minWidth: 88, paddingHorizontal: Spacing.md, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  buttonText: { color: '#FFF', fontWeight: Typography.weightBold, fontSize: Typography.fontSizeBase },
  pressed: { opacity: 0.7 },
});
