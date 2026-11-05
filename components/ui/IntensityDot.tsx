// Powered by OnSpace.AI
// cache-bust
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { getIntensityColor } from '@/constants/config';

interface IntensityDotProps {
  intensity: string;
  size?: number;
}

export const IntensityDot = memo(function IntensityDot({ intensity, size = 10 }: IntensityDotProps) {
  const diameter = Math.max(1, size);
  return (
    <View style={[styles.dot, { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: getIntensityColor(intensity) }]} />
  );
});

const styles = StyleSheet.create({
  dot: { flexShrink: 0 },
});
