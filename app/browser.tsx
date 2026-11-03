import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrowserContent } from '@/components/feature/BrowserContent';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { normalizeWebUrl, getLinkHost } from '@/services/linkService';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
export default function BrowserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const url = normalizeWebUrl(typeof params.url === 'string' ? params.url : '');
  const { openInExternalBrowser } = useExternalLinks();
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Fermer la page web" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="close" size={24} color={Colors.textPrimary} /></Pressable>
      <View style={styles.heading}><Text style={styles.title} numberOfLines={1}>{url ? getLinkHost(url) : 'Lien invalide'}</Text><Text style={styles.subtitle}>Dans Appletics</Text></View>
      {url ? <Pressable onPress={() => openInExternalBrowser(url)} style={({ pressed }) => [styles.external, pressed ? styles.pressed : null]}><MaterialIcons name="open-in-new" size={18} color={Colors.primary} /><Text style={styles.link}>Navigateur externe</Text></Pressable> : null}
    </View>
    {url ? <BrowserContent url={url} /> : <Text style={styles.error}>Cette adresse ne peut pas être ouverte.</Text>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconButton: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 1 },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  external: { flexDirection: 'row', flexShrink: 1, alignItems: 'center', gap: Spacing.xs, minHeight: 48, paddingHorizontal: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primaryLight },
  link: { fontSize: Typography.fontSizeSM, color: Colors.primary, flexShrink: 1 },
  error: { padding: Spacing.lg, fontSize: Typography.fontSizeBase, color: Colors.error },
  pressed: { opacity: 0.7 },
});
