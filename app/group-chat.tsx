import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useGroupChat } from '@/hooks/useGroupChat';
import { PushNotificationsPrompt } from '@/components/feature/PushNotificationsPrompt';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { GroupMessage } from '@/services/groupChatService';
import { markGroupRead } from '@/services/unreadStore';
import { AvatarPhoto } from '@/components/ui/AvatarPhoto';
import { GroupChatAddPeople } from '@/components/feature/GroupChatAddPeople';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';

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
  const { data, userId } = useSharedGroups();
  const group = data.groups.find(item => item.id === groupId);
  const memberCount = data.members.filter(item => item.group_id === groupId).length;
  const chat = useGroupChat(groupId);
  const isCoach = data.members.some(item => item.group_id === groupId && item.user_id === userId && item.role === 'coach');
  const [adding, setAdding] = useState(false);
  const [picker, setPicker] = useState<GroupMessage | null>(null);
  const openFile = (url?: string | null) => { if (url) void Linking.openURL(url); };
  // Image from the photo library or any file (PDF, programme…), sent with the text being typed as caption.
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf', '*/*'], multiple: false, copyToCacheDirectory: true });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset) return;
    await chat.sendFile({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? '', size: asset.size ?? undefined, file: (asset as { file?: Blob }).file });
  };
  const list = useRef<FlatList<GroupMessage>>(null);

  // Opens on the latest messages and stays at the bottom while new ones arrive (unless the user scrolled up).
  const atBottom = useRef(true);
  // Open conversation: its messages count as read (chat list, tab bar, app icon).
  const latest = chat.messages[chat.messages.length - 1]?.created_at;
  useEffect(() => { if (userId && groupId) void markGroupRead(userId, groupId, latest); }, [userId, groupId, latest]);
  useEffect(() => { if (chat.messages.length && atBottom.current) setTimeout(() => list.current?.scrollToEnd({ animated: false }), 50); }, [chat.messages.length]);

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
          {isCoach ? <Pressable accessibilityRole="button" accessibilityLabel="Ajouter des athlètes" onPress={() => setAdding(true)} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <MaterialIcons name="person-add" size={22} color={Colors.primary} />
          </Pressable> : null}
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
          initialNumToRender={400}
          onContentSizeChange={() => { if (atBottom.current) list.current?.scrollToEnd({ animated: false }); }}
          onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120; }}
          scrollEventThrottle={100}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<PushNotificationsPrompt />}
          ListEmptyComponent={!chat.loading ? <View style={styles.empty}>
            <MaterialIcons name="forum" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun message pour l’instant. Écrivez le premier au groupe.</Text>
          </View> : null}
          renderItem={({ item }) => {
            const own = item.sender_id === chat.userId;
            return (
              <Pressable onLongPress={() => setPicker(item)} delayLongPress={300} style={[styles.row, own ? styles.rowOwn : null, !own ? { flexDirection: 'row', alignItems: 'flex-end', gap: 6 } : null]}>
                {!own ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text verbatim style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>{(item.sender_name || 'M').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</Text>
                  <AvatarPhoto uri={data.members.find(member => member.group_id === groupId && member.user_id === item.sender_id)?.avatar} />
                </View> : null}
                <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther, chat.reactions.some(reaction => reaction.message_id === item.id) ? { marginBottom: 14 } : null]}>
                  {!own ? <Text verbatim style={styles.sender}>{item.sender_name || 'Membre'}</Text> : null}
                  {item.attachment_path ? (item.attachment_type?.startsWith('image/') && item.attachment_url
                    ? <Pressable accessibilityRole="imagebutton" accessibilityLabel={item.attachment_name ?? 'Image'} onPress={() => openFile(item.attachment_url)}><Image source={{ uri: item.attachment_url }} contentFit="cover" style={styles.image} /></Pressable>
                    : <Pressable accessibilityRole="link" onPress={() => openFile(item.attachment_url)} style={[styles.file, own ? styles.fileOwn : null]}>
                        <MaterialIcons name={item.attachment_type === 'application/pdf' ? 'picture-as-pdf' : 'insert-drive-file'} size={22} color={own ? '#FFF' : Colors.primary} />
                        <Text verbatim numberOfLines={1} style={[styles.fileName, own ? styles.bodyOwn : null]}>{item.attachment_name || 'Fichier'}</Text>
                      </Pressable>) : null}
                  {item.body ? <Text verbatim style={[styles.body, own ? styles.bodyOwn : null]}>{item.body}</Text> : null}
                  <Text verbatim style={[styles.time, own ? styles.timeOwn : null]}>{timeLabel(item.created_at)}</Text>
                  {(() => {
                    const list = chat.reactions.filter(reaction => reaction.message_id === item.id);
                    if (!list.length) return null;
                    const counts = [...new Set(list.map(reaction => reaction.emoji))].map(emoji => ({ emoji, count: list.filter(reaction => reaction.emoji === emoji).length, mine: list.some(reaction => reaction.emoji === emoji && reaction.user_id === chat.userId) }));
                    return <View style={[styles.reactions, own ? { right: 8 } : { left: 8 }]}>{counts.map(entry => (
                      <Pressable key={entry.emoji} accessibilityRole="button" accessibilityLabel={`Réaction ${entry.emoji}`} onPress={() => { void chat.react(item.id, entry.emoji); }} style={[styles.reaction, entry.mine ? styles.reactionMine : null]}>
                        <Text verbatim style={styles.reactionText}>{entry.count > 1 ? `${entry.emoji} ${entry.count}` : entry.emoji}</Text>
                      </Pressable>
                    ))}</View>;
                  })()}
                </View>
              </Pressable>
            );
          }}
        />

        {picker ? <View style={styles.picker}>
          {REACTIONS.map(emoji => (
            <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`Réagir ${emoji}`} onPress={() => { void chat.react(picker.id, emoji); setPicker(null); }} style={({ pressed }) => [styles.pickerEmoji, pressed ? styles.pressed : null]}>
              <Text verbatim style={{ fontSize: 26 }}>{emoji}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Plus d’actions" onPress={() => { const message = picker; setPicker(null); openActions(message); }} style={styles.pickerEmoji}><MaterialIcons name="more-horiz" size={26} color={Colors.textSecondary} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setPicker(null)} style={styles.pickerEmoji}><MaterialIcons name="close" size={22} color={Colors.textMuted} /></Pressable>
        </View> : <Text style={styles.hint}>Maintenez appuyé sur un message pour réagir, le signaler ou le supprimer.</Text>}
        <View style={styles.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Joindre une image ou un fichier" disabled={chat.sending} onPress={() => { void pickFile(); }} style={({ pressed }) => [styles.attach, pressed ? styles.pressed : null]}>
            <MaterialIcons name="attach-file" size={24} color={Colors.textSecondary} />
          </Pressable>
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
      <GroupChatAddPeople groupId={groupId} visible={adding} onClose={() => setAdding(false)} />
    </SafeAreaView>
  );
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏'];
const styles = StyleSheet.create({
  image: { width: 220, height: 220, borderRadius: Radius.md, marginBottom: 4, backgroundColor: Colors.border },
  file: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, marginBottom: 4, maxWidth: 240 },
  fileOwn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  fileName: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reactions: { position: 'absolute', bottom: -14, flexDirection: 'row', gap: 4 },
  reaction: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  reactionMine: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  reactionText: { fontSize: 13 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 2, paddingVertical: 6, marginHorizontal: 12, marginBottom: 4, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  pickerEmoji: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  attach: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
