// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useI18n } from '@/hooks/useI18n';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Athlete } from '@/types';
import { EVENT_GROUPS } from '@/constants/config';
import { Image } from 'expo-image';

interface AthleteRowProps {
  athlete: Athlete;
  onPress?: () => void;
}

export const AthleteRow = React.memo(({ athlete, onPress }: AthleteRowProps) => {
  const { t } = useI18n();
  const group = EVENT_GROUPS.find(g => g.id === athlete.group);
  const groupColor = group?.color || Colors.primary;
  const initials = athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityLabel={`${t('Athlète')} ${athlete.name}`}
    >
      <View style={[styles.avatar, { backgroundColor: groupColor + '30', borderColor: groupColor + '60' }]}>
        {athlete.avatar ? <Image source={{ uri: athlete.avatar }} contentFit="cover" style={{ width: '100%', height: '100%', borderRadius: 999 }} /> : <Text style={[styles.initials, { color: groupColor }]}>{initials}</Text>}
      </View>
      <View style={styles.info}>
        <Text verbatim style={styles.name}>{athlete.name}</Text>
        <Text style={styles.events}>{athlete.events.join(' · ')}</Text>
      </View>
      <View style={styles.right}>
        {athlete.status === 'injured' ? (
          <View style={styles.injuredBadge}>
            <Text style={styles.injuredText}>{t('injured')}</Text>
          </View>
        ) : null}
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  pressed: { opacity: 0.75 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  info: { flex: 1 },
  name: {
    fontSize: Typography.fontSizeBase,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  events: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  injuredBadge: {
    backgroundColor: Colors.error + '20',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.error + '50',
  },
  injuredText: { fontSize: Typography.fontSizeXS, color: Colors.error, fontWeight: Typography.weightSemibold },
});
