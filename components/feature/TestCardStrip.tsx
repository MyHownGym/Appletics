import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const CARD = '4242 4242 4242 4242';

// Shown only while Stripe runs in test mode: the test card to type on the Stripe page, one tap to copy.
// Stripe does not let an app pre-fill the card fields, so copying is the shortest path.
export const TestCardStrip = memo(function TestCardStrip() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(CARD.replace(/ /g, ''));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return <View style={styles.box}>
    <MaterialIcons name="credit-card" size={22} color={Colors.welcomeDeep} />
    <View style={{ flex: 1, minWidth: 1 }}>
      <Text style={styles.kicker}>Carte de test Stripe · aucun débit</Text>
      <Text verbatim selectable style={styles.number}>{CARD}</Text>
      <Text style={styles.meta}>Date 12/34 · CVC 123 · code postal au choix</Text>
    </View>
    <Pressable accessibilityRole="button" onPress={() => { void copy(); }} style={({ pressed }) => [styles.copy, pressed ? { opacity: 0.8 } : null]}>
      <MaterialIcons name={copied ? 'check' : 'content-copy'} size={16} color="#FFFFFF" />
      <Text style={styles.copyText}>{copied ? 'Copié' : 'Copier'}</Text>
    </Pressable>
  </View>;
});
const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary + '66', backgroundColor: Colors.primary + '0D', marginBottom: Spacing.md },
  kicker: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  number: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, letterSpacing: 1, marginTop: 2 },
  meta: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, marginTop: 2 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: Radius.full, backgroundColor: Colors.primary },
  copyText: { color: '#FFFFFF', fontWeight: Typography.weightBold, fontSize: Typography.fontSizeSM },
});
