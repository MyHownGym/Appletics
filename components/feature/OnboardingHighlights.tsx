import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface OnboardingHighlightsProps {
  compact?: boolean;
  training: string;
  progress: string;
  team: string;
}

export const OnboardingHighlights = memo(function OnboardingHighlights({ compact = false, training, progress, team }: OnboardingHighlightsProps) {
  return (
    <View style={[styles.features, compact ? styles.featuresCompact : null]}>
      <View style={styles.feature}>
        <MaterialIcons name="event-note" size={24} color={Colors.welcomeText} />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={styles.label}>{training}</Text>
      </View>
      <View style={[styles.feature, styles.divider]}>
        <MaterialIcons name="trending-up" size={24} color={Colors.welcomeText} />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={styles.label}>{progress}</Text>
      </View>
      <View style={styles.feature}>
        <MaterialIcons name="people-outline" size={24} color={Colors.welcomeText} />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={styles.label}>{team}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  features: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: Colors.welcomeLine, paddingTop: Spacing.lg },
  featuresCompact: { paddingTop: Spacing.sm },
  feature: { flex: 1, minWidth: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs },
  divider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.welcomeLine },
  label: { width: '100%', fontSize: Typography.fontSizeBase, lineHeight: Typography.fontSizeBase * Typography.lineHeightBody, fontWeight: Typography.weightMedium, textAlign: 'center', color: Colors.welcomeText, includeFontPadding: false },
});
