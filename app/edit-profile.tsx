import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEditProfile } from '@/hooks/useEditProfile';
import { useResponsive } from '@/hooks/useResponsive';
import { useI18n } from '@/hooks/useI18n';
import { ProfilePhotoPicker } from '@/components/feature/ProfilePhotoPicker';
import { CoachAthleteCountField } from '@/components/feature/CoachAthleteCountField';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const form = useEditProfile();
  const { t } = useI18n();
  const { screenPadding, maxContentWidth } = useResponsive();
  const disabled = !form.firstName.trim() || form.photo.busy || (!form.isClub && !form.isAthlete && !form.athleteCount.valid);
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{t('edit_profile')}</Text>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { maxWidth: Math.min(620, maxContentWidth), paddingHorizontal: screenPadding }]}>
        <ProfilePhotoPicker photo={form.photo} accentColor={form.accentColor} club={form.isClub} />
        <View style={styles.field}><Text style={styles.label}>{t('first_name')} *</Text><TextInput accessibilityLabel={t('first_name')} style={styles.input} value={form.firstName} onChangeText={form.setFirstName} textContentType="givenName" autoCapitalize="words" autoCorrect={false} placeholder={t('first_name')} placeholderTextColor={Colors.textMuted} /></View>
        <View style={styles.field}><Text style={styles.label}>{t('last_name')}</Text><TextInput accessibilityLabel={t('last_name')} style={styles.input} value={form.lastName} onChangeText={form.setLastName} textContentType="familyName" autoCapitalize="words" autoCorrect={false} placeholder={t('last_name')} placeholderTextColor={Colors.textMuted} /></View>
        <View style={styles.field}><Text style={styles.label}>{t('coach_club')}</Text><TextInput accessibilityLabel={t('coach_club')} style={styles.input} value={form.club} onChangeText={form.setClub} placeholder={t('coach_club')} placeholderTextColor={Colors.textMuted} /></View>
        <View style={styles.field}><Text style={styles.label}>{t('coach_email')}</Text><TextInput accessibilityLabel={t('coach_email')} editable={!form.emailReadOnly} style={styles.input} value={form.email} onChangeText={form.setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.ch" placeholderTextColor={Colors.textMuted} /></View>
        {form.roles.length ? <View style={styles.field}><Text style={styles.label}>{t('coach_role')}</Text><View style={styles.roles}>{form.roles.map(option => <Pressable accessibilityRole="button" accessibilityState={{ selected: form.role === option.id }} key={option.id} onPress={() => form.setRole(option.id)} style={({ pressed }) => [styles.chip, form.role === option.id ? { backgroundColor: form.accentColor, borderColor: form.accentColor } : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, form.role === option.id ? styles.onPrimary : null]}>{option.label}</Text></Pressable>)}</View></View> : null}
        {!form.isClub && !form.isAthlete ? <CoachAthleteCountField input={form.athleteCount} /> : null}
        <Pressable accessibilityLabel={t('save')} disabled={disabled} onPress={form.save} style={({ pressed }) => [styles.saveButton, { backgroundColor: form.accentColor }, pressed || disabled ? styles.pressed : null]}><MaterialIcons name="check" size={22} color={Colors.textOnPrimary} /><Text style={styles.saveText}>{t('save')}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  title: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  content: { width: '100%', alignSelf: 'center', paddingVertical: Spacing.lg, gap: Spacing.lg },
  field: { gap: Spacing.sm }, label: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  input: { minHeight: 48, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, chip: { minHeight: 48, justifyContent: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface },
  chipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary }, onPrimary: { color: Colors.textOnPrimary },
  saveButton: { minHeight: 56, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
  saveText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textOnPrimary }, pressed: { opacity: 0.65 },
});
