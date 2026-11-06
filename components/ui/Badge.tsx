// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Typography, Radius } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.primary, textColor = Colors.textOnPrimary, size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '25', borderColor: color + '50' }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.weightSemibold,
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: Typography.fontSizeXS,
  },
});
