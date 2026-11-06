import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// Shown when someone invited this account (same e-mail) to a shared group: one tap to accept.
export const PendingInvitationsBanner = memo(function PendingInvitationsBanner({ horizontalPadding = 0 }: { horizontalPadding?: number }) {
  const router = useRouter();
  const { data, email } = useSharedGroups();
  const pending = data.invitations.filter(item => item.status === 'pending' && item.email.toLowerCase() === email.toLowerCase() && new Date(item.expires_at).getTime() > Date.now());
  if (!pending.length) return null;
  const label = pending.length === 1 ? `Invitation à rejoindre « ${pending[0].group_name} »` : `${pending.length} invitations à rejoindre des groupes`;
  return <View style={{ paddingHorizontal: horizontalPadding }}>
    <Pressable accessibilityRole="button" onPress={() => router.push('/shared-groups')} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
      <View style={styles.icon}><MaterialIcons name="mark-email-unread" size={22} color="#FFF" /></View>
      <View style={styles.text}><Text verbatim style={styles.title}>{label}</Text><Text style={styles.body}>Appuyez pour accepter et rejoindre votre coach.</Text></View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
    </Pressable>
  </View>;
});
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, marginBottom: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  text: { flex: 1, gap: 2 },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  body: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  pressed: { opacity: 0.75 },
});
