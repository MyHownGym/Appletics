// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: { icon: string; onPress: () => void; label?: string };
  rightLabel?: string;
  onRightLabelPress?: () => void;
}

export function ScreenHeader({ title, subtitle, rightAction, rightLabel, onRightLabelPress }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel={rightAction.label || 'action'}
          hitSlop={8}
        >
          <MaterialIcons name={rightAction.icon as any} size={26} color={Colors.primary} />
        </Pressable>
      ) : null}
      {rightLabel ? (
        <Pressable onPress={onRightLabelPress} style={({ pressed }) => [styles.labelBtn, pressed && styles.pressed]}>
          <Text style={styles.labelBtnText}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  left: { flex: 1 },
  title: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.weightExtrabold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    marginTop: 2,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
  },
  labelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  labelBtnText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.weightBold,
  },
  pressed: { opacity: 0.7 },
});
