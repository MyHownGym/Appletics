import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useGroupChat } from '@/hooks/useGroupChat';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { GroupMessage } from '@/services/groupChatService';

function timeLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Online conversation shared by all members of a shared group.
export default function GroupChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { data } = useSharedGroups();
  const group = data.groups.find(item => item.id === groupId);
  const memberCount = data.members.filter(item => item.group_id === groupId).length;
  const chat = useGroupChat(groupId);
  const list = useRef<FlatList<GroupMessage>>(null);

  useEffect(() => { if (chat.messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50); }, [chat.messages.length]);

  const openActions = (message: GroupMessage) => {
    const own = message.sender_id === chat.userId;
    if (own) {
      showAlert('Supprimer ce message ?', '', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { void chat.remove(message.id); } },
      ]);
      return;
    }
    showAlert('Message', message.sender_name || '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Signaler le message', onPress: () => { void chat.report(message.id).then(ok => { if (ok) showAlert('Merci', 'Le message a été signalé. Nous allons l’examiner.'); }); } },
      { text: 'Bloquer cette personne', style: 'destructive', onPress: () => { void chat.block(message.sender_id).then(ok => { if (ok) showAlert('Personne bloquée', 'Vous ne verrez plus ses messages.'); }); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.flex}>
            <Text verbatim style={styles.title} numberOfLines={1}>{group?.name ?? ''}</Text>
            <Text style={styles.subtitle}>{`${memberCount} membre${memberCount > 1 ? 's' : ''}`}</Text>
          </View>
          <Pressable accessibilityLabel="Actualiser" onPress={() => { void chat.reload(); }} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <MaterialIcons name="refresh" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        {chat.loading && !chat.messages.length ? <ActivityIndicator style={styles.loader} color={Colors.primary} /> : null}
        {chat.error ? <View style={styles.errorRow}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text style={styles.errorText}>{chat.error}</Text></View> : null}

        <FlatList
          ref={list}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={chat.messages}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={!chat.loading ? <View style={styles.empty}>
            <MaterialIcons name="forum" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun message pour l’instant. Écrivez le premier au groupe.</Text>
          </View> : null}
          renderItem={({ item }) => {
            const own = item.sender_id === chat.userId;
            return (
              <Pressable onLongPress={() => openActions(item)} delayLongPress={350} style={[styles.row, own ? styles.rowOwn : null]}>
                <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
                  {!own ? <Text verbatim style={styles.sender}>{item.sender_name || 'Membre'}</Text> : null}
                  <Text verbatim style={[styles.body, own ? styles.bodyOwn : null]}>{item.body}</Text>
                  <Text verbatim style={[styles.time, own ? styles.timeOwn : null]}>{timeLabel(item.created_at)}</Text>
                </View>
              </Pressable>
            );
          }}
        />

        <Text style={styles.hint}>Appui long sur un message pour le signaler, bloquer son auteur ou supprimer le vôtre.</Text>
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message"
            value={chat.draft}
            onChangeText={chat.setDraft}
            placeholder="Écrire au groupe…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            style={styles.input}
          />
          <Pressable accessibilityLabel="Envoyer" disabled={chat.sending || !chat.draft.trim()} onPress={() => { void chat.send(); }}
            style={({ pressed }) => [styles.send, (chat.sending || !chat.draft.trim()) ? styles.sendDisabled : null, pressed ? styles.pressed : null]}>
            {chat.sending ? <ActivityIndicator color="#FFF" /> : <MaterialIcons name="send" size={22} color="#FFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { opacity: 0.6 },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary },
  loader: { marginTop: Spacing.lg },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, margin: Spacing.md, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surface },
  errorText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.error },
  list: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 60 },
  emptyText: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg, gap: 2 },
  bubbleOwn: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  sender: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.primary },
  body: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, lineHeight: 22 },
  bodyOwn: { color: '#FFF' },
  time: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(255,255,255,0.8)' },
  hint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.md, paddingBottom: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  sendDisabled: { opacity: 0.4 },
});
