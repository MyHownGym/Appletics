import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface AppBrandProps { compact?: boolean; light?: boolean }
export const AppBrand = memo(function AppBrand({ compact = false, light = false }: AppBrandProps) {
  return <View style={styles.row} accessibilityLabel="Appletics"><Image source={require('@/assets/images/appletics-icon.png')} contentFit="contain" transition={200} style={[styles.logo, compact ? styles.small : null]} />{!compact ? <Text style={[styles.name, light ? styles.light : null]}>Appletics</Text> : null}</View>;
});
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logo: { width: 32, height: 32, borderRadius: Radius.sm }, small: { width: 28, height: 28 },
  name: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false }, light: { color: Colors.textOnPrimary },
});
