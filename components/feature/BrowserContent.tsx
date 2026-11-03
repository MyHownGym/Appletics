import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface BrowserContentProps { url: string }
export const BrowserContent = memo(function BrowserContent({ url }: BrowserContentProps) {
  const { openLink } = useExternalLinks();
  return <View style={styles.panel}><Text style={styles.body}>Cette page s’ouvre dans une fenêtre intégrée à Appletics.</Text><Pressable onPress={() => void openLink(url)} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.label}>Ouvrir dans l’app</Text></Pressable></View>;
});
const styles = StyleSheet.create({
  panel: { flex: 1, justifyContent: 'center', padding: Spacing.lg, gap: Spacing.md },
  body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary },
  button: { minHeight: 48, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  label: { fontSize: Typography.fontSizeBase, color: Colors.textOnPrimary, fontWeight: Typography.weightSemibold },
  pressed: { opacity: 0.7 },
});
