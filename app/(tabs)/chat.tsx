// Powered by OnSpace.AI
// v4 - create + swipe-to-delete channels, i18n
import React, { useState, useRef } from 'react';
import {
  View, FlatList, Pressable, StyleSheet, Animated, PanResponder,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { ScreenHeader } from '@/components';
import { ChatChannel } from '@/types';
import { useActivityScope } from '@/hooks/useActivityScope';
import { BetaFeatureNotice } from '@/components/feature/BetaFeatureNotice';
import { useSharedGroups } from '@/hooks/useSharedGroups';

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  staff: 'supervisor-account', group: 'people', admin: 'admin-panel-settings',
};

const DELETE_BUTTON_WIDTH = 80;

function SwipeableChannelRow({
  item, onPress, onDelete, canDelete = true,
}: {
  item: ChatChannel;
  onPress: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => canDelete && Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      const dx = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, g.dx + (isOpen ? -DELETE_BUTTON_WIDTH : 0)));
      translateX.setValue(dx);
    },
    onPanResponderRelease: (_, g) => {
      const shouldOpen = g.dx < -DELETE_BUTTON_WIDTH / 2 || (isOpen && g.dx < 0);
      if (shouldOpen) {
        Animated.spring(translateX, { toValue: -DELETE_BUTTON_WIDTH, useNativeDriver: true }).start();
        setIsOpen(true);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setIsOpen(false);
      }
    },
  })).current;

  const closeRow = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setIsOpen(false);
  };

  const typeColors: Record<string, string> = { staff: '#60A5FA', group: '#34D399', admin: '#F87171' };
  const color = typeColors[item.type] || Colors.primary;
  const initials = item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const iconName = CHANNEL_TYPE_ICONS[item.type] || 'chat';

  return (
    <View style={styles.swipeWrap}>
      {/* Delete button (revealed on swipe) */}
      {canDelete ? <View style={styles.deleteActionWrap}>
        <Pressable style={styles.deleteAction} onPress={onDelete}>
          <MaterialIcons name="delete" size={22} color="#FFF" />
        </Pressable>
      </View> : null}
      {/* Channel row */}
      <Animated.View style={[styles.channelRowAnimated, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Pressable
          onPress={() => {
            if (isOpen) { closeRow(); return; }
            onPress();
          }}
          style={styles.channelRow}
        >
          <View style={[styles.avatar, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
            <View style={[styles.typeIcon, { backgroundColor: color }]}>
              <MaterialIcons name={iconName as any} size={10} color="#fff" />
            </View>
          </View>
          <View style={styles.channelInfo}>
            <View style={styles.channelTop}>
              <Text verbatim style={styles.channelName}>{item.name}</Text>
              <Text style={styles.channelTime}>{item.lastTime}</Text>
            </View>
            <View style={styles.channelBottom}>
              <Text verbatim style={styles.lastMsg} numberOfLines={1}>{item.lastMessage || '…'}</Text>
              {item.unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { deleteChannel, user } = useApp();
  const { channels } = useActivityScope();
  const isAthlete = user.userType === 'athlete';
  const { t } = useI18n();
  const [tab, setTab] = useState('all');
  const { screenPadding, isPhone } = useResponsive();
  const shared = useSharedGroups();
  const onlineGroups = shared.data.groups;

  const channelTabs = isAthlete ? [{ id: 'all', label: t('all') }, { id: 'group', label: t('groups') }] : [
    { id: 'all', label: t('all') },
    { id: 'staff', label: t('staff') },
    { id: 'group', label: t('groups') },
    { id: 'admin', label: t('admin') },
  ];

  const filtered = tab === 'all' ? channels : channels.filter(c => c.type === tab);
  const totalUnread = channels.reduce((sum, c) => sum + c.unread, 0);

  const handleDelete = (channel: ChatChannel) => {
    showAlert(
      t('delete'),
      `"${channel.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteChannel(channel.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        title={t('chat_messages')}
        subtitle={totalUnread > 0 ? `${totalUnread} unread` : t('all_caught_up')}
        rightAction={!isAthlete ? {
          icon: 'add',
          label: t('add'),
          onPress: () => router.push('/create-channel'),
        } : undefined}
      />

      {/* Tab filter */}
      <View style={styles.tabRow}>
        {channelTabs.map(tabItem => {
          const isActive = tab === tabItem.id;
          return (
            <Pressable
              key={tabItem.id}
              onPress={() => setTab(tabItem.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tabItem.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingHorizontal: screenPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SwipeableChannelRow
            item={item}
            canDelete={!isAthlete}
            onPress={() => router.push({ pathname: '/chat-room', params: { channelId: item.id } })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListHeaderComponent={<View style={styles.onlineSection}>
          <BetaFeatureNotice kind="chat" />
          <Text style={styles.sectionTitle}>Discussions de groupe en ligne</Text>
          {onlineGroups.length ? onlineGroups.map(group => (
            <Pressable key={group.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/group-chat', params: { id: group.id } })}
              style={({ pressed }) => [styles.onlineRow, pressed ? { opacity: 0.7 } : null]}>
              <View style={styles.onlineIcon}><MaterialIcons name="forum" size={20} color="#FFF" /></View>
              <View style={styles.channelInfo}>
                <Text verbatim style={styles.channelName} numberOfLines={1}>{group.name}</Text>
                <Text style={styles.lastMsg}>{`${shared.data.members.filter(member => member.group_id === group.id).length} membre(s) · en ligne`}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
            </Pressable>
          )) : (
            <Pressable accessibilityRole="button" onPress={() => router.push('/shared-groups')} style={({ pressed }) => [styles.onlineRow, pressed ? { opacity: 0.7 } : null]}>
              <View style={styles.onlineIcon}><MaterialIcons name="group-add" size={20} color="#FFF" /></View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>Créer ou rejoindre un groupe partagé</Text>
                <Text style={styles.lastMsg}>Chaque groupe a sa discussion en ligne.</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
            </Pressable>
          )}
          {channels.length ? <Text style={styles.sectionTitle}>Sur cet appareil</Text> : null}
        </View>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('no_channels')}</Text>
            {!isAthlete ? <Pressable
              style={styles.createBtn}
              onPress={() => router.push('/create-channel')}
            >
              <MaterialIcons name="add" size={18} color="#FFF" />
              <Text style={styles.createBtnText}>{t('add')} {t('groups')}</Text>
            </Pressable> : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  onlineSection: { gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.sm },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  onlineIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  screen: { flex: 1, backgroundColor: Colors.background },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  tabLabelActive: { color: '#FFF' },
  list: { paddingBottom: 120 },
  swipeWrap: { marginBottom: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  deleteActionWrap: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_BUTTON_WIDTH,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md,
  },
  deleteAction: { alignItems: 'center', justifyContent: 'center', flex: 1, width: DELETE_BUTTON_WIDTH },
  channelRowAnimated: { backgroundColor: Colors.background },
  channelRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.surfaceCard,
  },
  channelInfo: { flex: 1 },
  channelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  channelName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  channelTime: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  channelBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, flex: 1 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { fontSize: Typography.fontSizeXS, color: '#FFF', fontWeight: Typography.weightBold },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10,
  },
  createBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
