import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

// Profile photo drawn over an initials bubble (the bubble stays as a fallback when there is no photo).
export const AvatarPhoto = memo(function AvatarPhoto({ uri }: { uri?: string | null }) {
  if (!uri) return null;
  return <Image source={{ uri }} contentFit="cover" transition={150} style={styles.fill} accessibilityIgnoresInvertColors />;
});

const styles = StyleSheet.create({ fill: { ...StyleSheet.absoluteFillObject, borderRadius: 999 } });
