// Powered by OnSpace.AI
// v2 - i18n, redirect to chat tab, add members from athletes list
import React, { useState } from 'react';
import {
  View, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { ChatChannel, ChatMember } from '@/types';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';

const CHANNEL_TYPES = [
  { id: 'group', icon: 'people', color: '#34D399' },
  { id: 'staff', icon: 'supervisor-account', color: '#60A5FA' },
  { id: 'admin', icon: 'admin-panel-settings', color: '#F87171' },
] as const;

export default function CreateChannelScreen() {
  const router = useRouter();
  const { addChannel, athletes, user, channels } = useApp();
  const ensureQuota = useSubscriptionQuota();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState<'group' | 'staff' | 'admin'>('group');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);

  const toggleAthlete = (id: string) =>
    setSelectedAthletes(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const handleCreate = () => {
    if (!name.trim() || !ensureQuota('channels', channels.length)) return;

    // Build members list
    const members: ChatMember[] = [
      { id: user.id, name: user.name, role: (user.userType as ChatMember['role']) || 'coach' },
    ];
    selectedAthletes.forEach(athleteId => {
      const athlete = athletes.find(a => a.id === athleteId);
      if (athlete) {
        members.push({ id: athlete.id, name: athlete.name, role: 'athlete' });
      }
    });

    const channel: ChatChannel = {
      id: `ch-${Date.now()}`,
      name: name.trim(),
      type,
      memberCount: members.length,
      members,
      lastMessage: '',
      lastTime: 'Maintenant',
      unread: 0,
    };
    addChannel(channel);
    // Redirect to chat tab (not back to home)
    router.replace('/(tabs)/chat');
  };

  const typeLabels: Record<string, string> = {
    group: t('groups'), staff: t('staff'), admin: t('admin'),
  };
  const typeColors = Object.fromEntries(CHANNEL_TYPES.map(ct => [ct.id, ct.color]));
  const selectedType = CHANNEL_TYPES.find(ct => ct.id === type);
  const accentColor = selectedType?.color || Colors.primary;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('add')} {t('groups')}</Text>
          <Pressable
            onPress={handleCreate}
            style={[styles.saveBtn, { backgroundColor: name.trim() ? accentColor : Colors.border }]}
            disabled={!name.trim()}
          >
            <Text style={styles.saveBtnText}>{t('add')}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Channel name */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('chat_messages')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ex. Groupe Sprints, Staff Coaching..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('group')}</Text>
            <View style={styles.chipRow}>
              {CHANNEL_TYPES.map(ct => (
                <Pressable
                  key={ct.id}
                  onPress={() => setType(ct.id)}
                  style={[
                    styles.chip,
                    type === ct.id
                      ? { backgroundColor: ct.color, borderColor: ct.color }
                      : { backgroundColor: Colors.surface, borderColor: Colors.border },
                  ]}
                >
                  <MaterialIcons name={ct.icon as any} size={16} color={type === ct.id ? '#FFF' : Colors.textSecondary} />
                  <Text style={[styles.chipText, type === ct.id && { color: '#FFF' }]}>{typeLabels[ct.id]}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Members — athletes */}
          {athletes.length > 0 ? (
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('all_athletes')} — {t('add')} ({selectedAthletes.length} {t('select').toLowerCase()})
              </Text>
              {athletes.map(a => {
                const isSelected = selectedAthletes.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => toggleAthlete(a.id)}
                    style={[styles.memberRow, isSelected && { borderColor: accentColor, backgroundColor: accentColor + '0D' }]}
                  >
                    <View style={[styles.checkbox, isSelected && { backgroundColor: accentColor, borderColor: accentColor }]}>
                      {isSelected ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
                    </View>
                    <View style={styles.memberInfo}>
                      <Text verbatim style={styles.memberName}>{a.name}</Text>
                      <Text style={styles.memberSub}>{a.events.join(' · ')}</Text>
                    </View>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: a.status === 'active' ? Colors.success : a.status === 'injured' ? Colors.error : Colors.textMuted }
                    ]} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Summary */}
          <View style={[styles.summaryCard, { borderColor: accentColor + '40', backgroundColor: accentColor + '08' }]}>
            <MaterialIcons name={selectedType?.icon as any} size={18} color={accentColor} />
            <Text verbatim style={[styles.summaryText, { color: accentColor }]}>
              {name.trim() || '...'} · {1 + selectedAthletes.length} {t('athletes').toLowerCase()}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: 8, backgroundColor: Colors.background, borderRadius: Radius.md },
  headerTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  saveBtn: { borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  saveBtnText: { color: '#FFF', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 120 },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 13, fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: Spacing.xs,
    borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  memberSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  summaryText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold },
});
