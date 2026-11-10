import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// After the free trial without a plan: data stays readable, creating new items asks for a plan.
export function TrialGate({ children }: { children: ReactNode }) {
  const { trialLocked } = useApp();
  const router = useRouter();
  if (!trialLocked) return <>{children}</>;
  return <SafeAreaView style={styles.screen}>
    <View style={styles.box}>
      <View style={styles.icon}><MaterialIcons name="lock-clock" size={34} color={Colors.primary} /></View>
      <Text style={styles.title}>Ton essai gratuit est terminé</Text>
      <Text style={styles.body}>Tes plans, athlètes et résultats restent consultables. Choisis une formule pour en créer de nouveaux.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/upgrade')} style={({ pressed }) => [styles.button, pressed ? { opacity: 0.85 } : null]}><Text style={styles.buttonText}>Choisir ma formule</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.link}><Text style={styles.linkText}>Retour</Text></Pressable>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  box: { width: '100%', maxWidth: 440, alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.fontSizeXL, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  body: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  button: { alignSelf: 'stretch', height: 52, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: Typography.fontSizeBase },
  link: { padding: Spacing.sm }, linkText: { color: Colors.textSecondary, fontWeight: '600' },
});
