// Powered by OnSpace.AI
// v3 - manage members (add/remove), member list panel
import React, { useState, useRef, useEffect } from 'react';
import {
  View, FlatList, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { ChatMessage, ChatMember } from '@/types';
import { BetaFeatureNotice } from '@/components/feature/BetaFeatureNotice';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { channels, messages, sendMessage, markChannelRead, deleteChannel, updateChannel, athletes, user } = useApp();
  const { t } = useI18n();
  const [inputText, setInputText] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const atBottom = useRef(true); // opens on the latest messages

  const channel = channels.find(c => c.id === channelId);
  const channelMessages = messages[channelId] || [];
  const members: ChatMember[] = channel?.members || [];

  useEffect(() => {
    if (channelId) markChannelRead(channelId);
  }, [channelId]);

  useEffect(() => {
    if (channelMessages.length > 0 && atBottom.current) {
      const timer = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      return () => clearTimeout(timer);
    }
  }, [channelMessages.length]);

  const handleSend = () => {
    if (!inputText.trim() || !channelId) return;
    sendMessage(channelId, inputText.trim());
    setInputText('');
  };

  const handleDeleteChannel = () => {
    showAlert(
      t('delete'),
      `${t('delete')} "${channel?.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'), style: 'destructive', onPress: () => {
            deleteChannel(channelId);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddMember = (athleteId: string) => {
    if (!channel) return;
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;
    const alreadyIn = members.some(m => m.id === athleteId);
    if (alreadyIn) return;
    const newMember: ChatMember = { id: athlete.id, name: athlete.name, role: 'athlete' };
    const updatedMembers = [...members, newMember];
    updateChannel({ ...channel, members: updatedMembers, memberCount: updatedMembers.length });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!channel) return;
    if (memberId === user.id) {
      showAlert('Impossible', 'Vous ne pouvez pas vous retirer du canal.');
      return;
    }
    showAlert(
      t('delete'),
      `Retirer ce membre du canal "${channel.name}" ?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive', onPress: () => {
            const updatedMembers = members.filter(m => m.id !== memberId);
            updateChannel({ ...channel, members: updatedMembers, memberCount: updatedMembers.length });
          },
        },
      ]
    );
  };

  const CHANNEL_TYPE_COLORS: Record<string, string> = {
    staff: '#60A5FA', group: '#34D399', admin: '#F87171',
  };
  const channelColor = channel ? (CHANNEL_TYPE_COLORS[channel.type] || Colors.primary) : Colors.primary;

  // Athletes not yet in channel
  const availableAthletes = athletes.filter(a => !members.some(m => m.id === a.id));

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prevMsg = channelMessages[index - 1];
    const showSender = !item.isOwn && (!prevMsg || prevMsg.senderId !== item.senderId);
    return (
      <View style={[styles.msgWrap, item.isOwn && styles.msgWrapOwn]}>
        {showSender ? <Text verbatim style={styles.senderName}>{item.senderName}</Text> : null}
        <View style={[styles.bubble, item.isOwn ? styles.bubbleOwn : null]}>
          <Text verbatim style={[styles.msgText, item.isOwn && styles.msgTextOwn]}>{item.text}</Text>
          <Text style={[styles.msgTime, item.isOwn && styles.msgTimeOwn]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  if (!channel) return null;

  const ROLE_COLORS: Record<ChatMember['role'], string> = {
    coach: Colors.primary, athlete: Colors.info, admin: Colors.error,
  };
  const ROLE_ICONS: Record<ChatMember['role'], string> = {
    coach: 'sports', athlete: 'directions-run', admin: 'verified-user',
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={[styles.channelAvatar, { backgroundColor: channelColor + '20', borderColor: channelColor + '50' }]}>
          <Text style={[styles.channelAvatarText, { color: channelColor }]}>
            {channel.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Pressable style={styles.headerInfo} onPress={() => setShowMembers(true)}>
          <Text verbatim style={styles.channelName}>{channel.name}</Text>
          <Text style={[styles.memberCount, { color: channelColor }]}>
            {channel.memberCount} membre{channel.memberCount !== 1 ? 's' : ''} · Gérer
          </Text>
        </Pressable>
        <Pressable onPress={handleDeleteChannel} style={styles.deleteChannelBtn} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={channelMessages}
          keyExtractor={item => item.id}
          initialNumToRender={400}
          onContentSizeChange={() => { if (atBottom.current) flatListRef.current?.scrollToEnd({ animated: false }); }}
          onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120; }}
          scrollEventThrottle={100}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={renderMessage}
          ListHeaderComponent={<BetaFeatureNotice kind="local" />}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyChatText}>{t('no_channels')}</Text>
            </View>
          }
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('type_message')}
            placeholderTextColor={Colors.textMuted}
            multiline maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? Colors.primary : Colors.surface },
              pressed && { opacity: 0.8 },
            ]}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={20} color={inputText.trim() ? '#FFF' : Colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Members panel */}
      <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMembers(false)}>
          <Pressable style={[styles.membersSheet, Shadow.strong]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>Membres ({members.length})</Text>
              <Pressable onPress={() => setShowMembers(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ height: 400 }}>
              {/* Current members */}
              <Text style={styles.membersSubtitle}>Membres actuels</Text>
              {members.map(m => {
                const roleColor = ROLE_COLORS[m.role] || Colors.primary;
                const roleIcon = ROLE_ICONS[m.role] || 'person';
                const isMe = m.id === user.id;
                return (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={[styles.memberAvatar, { backgroundColor: roleColor + '18', borderColor: roleColor + '40' }]}>
                      <Text style={[styles.memberAvatarText, { color: roleColor }]}>
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text verbatim style={styles.memberName}>{m.name}{isMe ? t(' (vous)') : ''}</Text>
                      <View style={[styles.rolePill, { backgroundColor: roleColor + '18' }]}>
                        <MaterialIcons name={roleIcon as any} size={10} color={roleColor} />
                        <Text style={[styles.roleText, { color: roleColor }]}>{t(m.role)}</Text>
                      </View>
                    </View>
                    {!isMe ? (
                      <Pressable
                        style={styles.removeMemberBtn}
                        onPress={() => handleRemoveMember(m.id)}
                        hitSlop={8}
                      >
                        <MaterialIcons name="person-remove" size={18} color={Colors.error} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {/* Add athletes not in channel */}
              {availableAthletes.length > 0 ? (
                <>
                  <Text style={[styles.membersSubtitle, { marginTop: Spacing.md }]}>
                    {t('add')} {t('athletes')}
                  </Text>
                  {availableAthletes.map(a => (
                    <Pressable
                      key={a.id}
                      style={[styles.memberRow, styles.addMemberRow]}
                      onPress={() => handleAddMember(a.id)}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: Colors.info + '18', borderColor: Colors.info + '40' }]}>
                        <Text style={[styles.memberAvatarText, { color: Colors.info }]}>
                          {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text verbatim style={styles.memberName}>{a.name}</Text>
                        <Text style={styles.memberSub}>{a.events.join(' · ')}</Text>
                      </View>
                      <View style={[styles.addBtn, { backgroundColor: channelColor }]}>
                        <MaterialIcons name="person-add" size={14} color="#FFF" />
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: 6, backgroundColor: Colors.background, borderRadius: Radius.md },
  channelAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  channelAvatarText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  headerInfo: { flex: 1 },
  channelName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  memberCount: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, marginTop: 1 },
  deleteChannelBtn: {
    padding: 8, backgroundColor: Colors.error + '12', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm, gap: 4 },
  msgWrap: { marginBottom: 4, maxWidth: '80%', alignSelf: 'flex-start' },
  msgWrapOwn: { alignSelf: 'flex-end' },
  senderName: {
    fontSize: Typography.fontSizeXS, color: Colors.textMuted,
    marginBottom: 3, marginLeft: 4, fontWeight: Typography.weightSemibold,
  },
  bubble: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderBottomLeftRadius: 4, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, paddingBottom: Spacing.sm,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary, borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: 4, borderColor: Colors.primary,
  },
  msgText: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, lineHeight: 22 },
  msgTextOwn: { color: '#FFF' },
  msgTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  msgTimeOwn: { color: '#FFFFFF99' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface, gap: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyChatText: { fontSize: Typography.fontSizeBase, color: Colors.textMuted, textAlign: 'center' },
  // Members modal
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  membersSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.sm, paddingBottom: 48,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  membersSubtitle: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.background, borderRadius: Radius.md, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  addMemberRow: { borderStyle: 'dashed', borderColor: Colors.primary + '50', backgroundColor: Colors.primary + '04' },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  memberInfo: { flex: 1 },
  memberName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  memberSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 1 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
  roleText: { fontSize: 10, fontWeight: Typography.weightBold },
  removeMemberBtn: { padding: 6, backgroundColor: Colors.error + '12', borderRadius: 8 },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
