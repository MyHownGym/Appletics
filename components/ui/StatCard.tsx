// Powered by OnSpace.AI
// cache-bust
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: string;
}

export const StatCard = React.memo(({ label, value, icon, color = Colors.primary, trend }: StatCardProps) => (
  <View style={[styles.card, Shadow.card]}>
    <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
    {trend ? <Text style={[styles.trend, { color: Colors.success }]}>{trend}</Text> : null}
  </View>
));

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 90,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    fontWeight: Typography.weightMedium,
  },
  trend: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.weightSemibold,
    marginTop: 2,
  },
});
