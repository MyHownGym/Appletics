import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
interface SharedGroupsLinkProps {}
export const SharedGroupsLink = memo(function SharedGroupsLink(_props: SharedGroupsLinkProps) {
 const router = useRouter(); const shared = useSharedGroups();
 const pending = shared.data.invitations.filter(item => item.status === 'pending' && item.email.toLowerCase() === shared.email.toLowerCase() && new Date(item.expires_at).getTime() > Date.now()).length;
 return <Pressable accessibilityRole="button" onPress={() => router.push('/shared-groups')} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}><MaterialIcons name="groups" size={28} color={Colors.clubDeep} /><View style={styles.copy}><Text style={styles.title}>Groupes</Text><Text style={styles.body}>Coachs et athlètes, dans le même groupe.</Text></View>{pending ? <Text style={styles.badge}>{pending}</Text> : null}<MaterialIcons name="chevron-right" size={24} color={Colors.clubDeep} /></Pressable>;
});
const styles = StyleSheet.create({ card: { marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.clubDeep, backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, copy: { flex: 1 }, title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.clubDeep }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary }, badge: { minWidth: 28, padding: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, color: Colors.welcomeDeep, textAlign: 'center', fontSize: Typography.fontSizeBase }, pressed: { opacity: 0.7 } });
