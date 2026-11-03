import { memo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '@/hooks/useI18n';
import type { useCoachAthleteCount } from '@/hooks/useCoachAthleteCount';
import { onboardingCopy } from '@/constants/onboarding';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface CoachAthleteCountFieldProps {
  input: ReturnType<typeof useCoachAthleteCount>;
}

export const CoachAthleteCountField = memo(function CoachAthleteCountField({ input }: CoachAthleteCountFieldProps) {
  const { language } = useI18n();
  const copy = onboardingCopy[language];
  return <View style={styles.field}>
    <View style={styles.heading}>
      <Text style={styles.label}>{copy.athleteCount}</Text>
      <View style={styles.optional}><Text style={styles.optionalText}>{copy.optional}</Text></View>
    </View>
    <View style={[styles.inputWrap, !input.valid ? styles.invalid : null]}>
      <MaterialIcons name="people-outline" size={22} color={Colors.textSecondary} />
      <TextInput accessibilityLabel={`${copy.athleteCount} (${copy.optional})`} style={styles.input} value={input.text} onChangeText={input.setText} keyboardType="number-pad" inputMode="numeric" autoCorrect={false} maxLength={6} placeholder="12" placeholderTextColor={Colors.textSecondary} selectionColor={Colors.primaryDark} />
    </View>
    {!input.valid ? <View style={styles.errorRow} accessibilityLiveRegion="polite"><MaterialIcons name="error-outline" size={18} color={Colors.error} /><Text style={styles.error}>{copy.countError}</Text></View> : null}
    <Text style={styles.hint}>{copy.countHint}</Text>
  </View>;
});

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  label: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, includeFontPadding: false },
  optional: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  optionalText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightMedium, color: Colors.welcomeInk },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md },
  input: { flex: 1, minHeight: Spacing.xxl, paddingVertical: Spacing.sm, fontSize: Typography.fontSizeBase, color: Colors.textPrimary, includeFontPadding: false },
  invalid: { borderColor: Colors.error },
  hint: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: Typography.fontSizeBase * Typography.lineHeightBody },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  error: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.error, lineHeight: Typography.fontSizeBase * Typography.lineHeightBody },
});
