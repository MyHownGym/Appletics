import { memo, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { AvatarPhoto } from '@/components/ui/AvatarPhoto';
import { SwipeSheet } from '@/components/ui/SwipeSheet';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { webScroll } from '@/constants/webScroll';

// Coach: adds athletes already followed in another group straight into this group and its discussion.
export const GroupChatAddPeople = memo(function GroupChatAddPeople({ groupId, visible, onClose }: { groupId: string; visible: boolean; onClose: () => void }) {
  const shared = useSharedGroups();
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const uid = shared.userId;
  const candidates = useMemo(() => {
    const coached = new Set(shared.data.members.filter(item => item.user_id === uid && item.role === 'coach').map(item => item.group_id));
    const inGroup = new Set(shared.data.members.filter(item => item.group_id === groupId).map(item => item.user_id));
    const seen = new Set<string>();
    return shared.data.members.filter(item => coached.has(item.group_id) && item.role === 'athlete' && !inGroup.has(item.user_id) && !seen.has(item.user_id) && seen.add(item.user_id))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [shared.data.members, uid, groupId]);
  const add = async (userId: string) => {
    setBusy(userId); setError('');
    try { await shared.operate('shared_add_known_athlete', { p_group: groupId, p_user: userId }); void shared.refresh(); }
    catch (reason) { setError(reason instanceof Error && reason.message === 'function_missing' ? 'Mettez à jour la base Supabase (fichier SQL n°12).' : 'Ajout impossible. Réessayez.'); }
    finally { setBusy(''); }
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
      <SwipeSheet onClose={onClose} style={styles.sheet}><SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View style={styles.head}>
          <Text style={styles.title}>Ajouter à la discussion</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.close}><MaterialIcons name="close" size={22} color={Colors.textPrimary} /></Pressable>
        </View>
        <ScrollView style={webScroll} contentContainerStyle={styles.list}>
          {candidates.length ? candidates.map(item => (
            <View key={item.user_id} style={styles.row}>
              <View style={styles.avatar}><Text verbatim style={styles.initials}>{(item.display_name || 'A').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</Text><AvatarPhoto uri={item.avatar} /></View>
              <Text verbatim style={styles.name} numberOfLines={1}>{item.display_name || 'Athlète'}</Text>
              <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => { void add(item.user_id); }} style={({ pressed }) => [styles.addButton, pressed || busy === item.user_id ? { opacity: 0.6 } : null]}>
                <MaterialIcons name="person-add" size={18} color="#FFF" /><Text style={styles.addText}>{busy === item.user_id ? '…' : 'Ajouter'}</Text>
              </Pressable>
            </View>
          )) : <Text style={styles.empty}>Tous vos athlètes avec un compte sont déjà dans ce groupe.</Text>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push({ pathname: '/shared-group', params: { id: groupId } }); }} style={({ pressed }) => [styles.invite, pressed ? { opacity: 0.7 } : null]}>
            <MaterialIcons name="mail-outline" size={20} color={Colors.primary} /><Text style={styles.inviteText}>Inviter un nouvel athlète par e-mail</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView></SwipeSheet>
    </View>
  </Modal>;
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 600, maxHeight: '80%', backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  head: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700', color: Colors.primary },
  name: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 14, borderRadius: Radius.full, backgroundColor: Colors.primary },
  addText: { color: '#FFF', fontWeight: '700' },
  empty: { color: Colors.textSecondary, paddingVertical: Spacing.md },
  error: { color: Colors.error },
  invite: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 48, justifyContent: 'center', marginTop: Spacing.sm },
  inviteText: { color: Colors.primary, fontWeight: '700' },
});
