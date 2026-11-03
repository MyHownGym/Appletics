import { createElement, memo, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useI18n } from '@/hooks/useI18n';
import { Colors, Typography, Spacing } from '@/constants/theme';
interface BrowserContentProps { url: string }
// Isolated Expo Web adapter. Browser security may refuse embedding; no automatic external redirect.
export const BrowserContent = memo(function BrowserContent({ url }: BrowserContentProps) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return <View style={styles.container}>
    <Text style={styles.notice}>Vue intégrée. Certains sites (dont Instagram) bloquent leur affichage dans l’aperçu web. Vous pouvez choisir « Navigateur externe » ; sur mobile, les pages s’ouvrent dans l’app.</Text>
    <View style={styles.frame}>{ready ? createElement('iframe', {
      src: url, title: t('Page web intégrée'), referrerPolicy: 'no-referrer',
      sandbox: 'allow-scripts allow-same-origin allow-forms',
      style: { border: 0, width: '100%', height: '100%', backgroundColor: Colors.surface },
    }) : null}</View>
  </View>;
});
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  notice: { padding: Spacing.md, fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary, backgroundColor: Colors.primaryLight },
  frame: { flex: 1, minHeight: 1 },
});
