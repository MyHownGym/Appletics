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

const initialsOf = (name: string) => (name || 'A').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

// Starts (or reopens) a private conversation with someone from one of my groups.
export const NewDirectMessage = memo(function NewDirectMessage({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const shared = useSharedGroups();
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const uid = shared.userId;
  const people = useMemo(() => {
    const mine = new Set(shared.data.members.filter(item => item.user_id === uid).map(item => item.group_id));
    const seen = new Set<string>();
    return shared.data.members.filter(item => mine.has(item.group_id) && item.user_id !== uid && !seen.has(item.user_id) && seen.add(item.user_id))
      .sort((a, b) => (a.role === b.role ? 0 : a.role === 'coach' ? -1 : 1) || a.display_name.localeCompare(b.display_name));
  }, [shared.data.members, uid]);
  const open = async (userId: string) => {
    setBusy(userId); setError('');
    try {
      const id = await shared.operate<string>('appletics_open_direct', { p_user: userId });
      onClose();
      router.push({ pathname: '/group-chat', params: { id } });
    } catch (reason) {
      setError(reason instanceof Error && reason.message === 'function_missing' ? 'Mettez à jour la base Supabase (fichier SQL n°15).' : 'Impossible d’ouvrir la discussion. Réessayez.');
    } finally { setBusy(''); }
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
      <SwipeSheet onClose={onClose} style={styles.sheet}><SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View style={styles.head}>
          <Text style={styles.title}>Nouveau message privé</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.close}><MaterialIcons name="close" size={22} color={Colors.textPrimary} /></Pressable>
        </View>
        <ScrollView style={webScroll} contentContainerStyle={styles.list}>
          {people.length ? people.map(item => (
            <Pressable key={item.user_id} accessibilityRole="button" disabled={!!busy} onPress={() => { void open(item.user_id); }}
              style={({ pressed }) => [styles.row, pressed || busy === item.user_id ? { opacity: 0.6 } : null]}>
              <View style={styles.avatar}><Text verbatim style={styles.initials}>{initialsOf(item.display_name)}</Text><AvatarPhoto uri={item.avatar} /></View>
              <View style={{ flex: 1 }}>
                <Text verbatim style={styles.name} numberOfLines={1}>{item.display_name || 'Membre'}</Text>
                <Text style={styles.role}>{item.role === 'coach' ? 'Coach' : 'Athlète'}</Text>
              </View>
              <MaterialIcons name={busy === item.user_id ? 'hourglass-empty' : 'chat-bubble-outline'} size={20} color={Colors.primary} />
            </Pressable>
          )) : <Text style={styles.empty}>Les membres de vos groupes apparaîtront ici dès qu’ils auront un compte.</Text>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  name: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  role: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  empty: { color: Colors.textSecondary, paddingVertical: Spacing.md },
  error: { color: Colors.error },
});
