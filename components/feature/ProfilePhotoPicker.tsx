import { memo } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';

interface ProfilePhotoPickerProps { photo: ReturnType<typeof useProfilePhoto>; accentColor: string; club?: boolean }
export const ProfilePhotoPicker = memo(function ProfilePhotoPicker({ photo, accentColor, club = false }: ProfilePhotoPickerProps) {
  const { t } = useI18n();
  const { translate } = useLocalizedCopy();
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{t('profile_photo')}</Text>
      <View style={styles.row}>
        <Pressable disabled={photo.busy} accessibilityLabel={t(photo.avatar ? 'photo_change' : 'photo_choose')} onPress={() => { void photo.choose(); }} style={({ pressed }) => [styles.avatar, { borderColor: accentColor, backgroundColor: accentColor + '10' }, pressed ? styles.pressed : null]}>
          {photo.avatar ? <Image source={{ uri: photo.avatar }} contentFit="cover" transition={200} style={styles.image} /> : <MaterialIcons name={club ? 'corporate-fare' : 'person-outline'} size={32} color={accentColor} />}
          <View style={[styles.camera, { backgroundColor: accentColor }]}>{photo.busy ? <ActivityIndicator size="small" color={Colors.textOnPrimary} /> : <MaterialIcons name="add-a-photo" size={16} color={Colors.textOnPrimary} />}</View>
        </Pressable>
        <View style={styles.actions}>
          <Pressable disabled={photo.busy} onPress={() => { void photo.choose(); }} style={({ pressed }) => [styles.button, { borderColor: accentColor + '40' }, pressed || photo.busy ? styles.pressed : null]}><Text style={[styles.buttonText, { color: accentColor }]}>{t(photo.avatar ? 'photo_change' : 'photo_choose')}</Text></Pressable>
          {photo.avatar ? <Pressable disabled={photo.busy} onPress={photo.remove} style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}><Text style={styles.removeText}>{t('photo_remove')}</Text></Pressable> : <Text style={styles.hint}>{t('optional')}</Text>}
        </View>
      </View>
      <Modal visible={photo.sourceOpen} transparent animationType="fade" onRequestClose={photo.closeSources}>
        <SafeAreaView style={styles.sourceOverlay} edges={['top', 'bottom']}><View style={styles.sourceSheet} accessibilityViewIsModal>
          <Text style={styles.label}>Choisir une photo</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={translate('Photothèque')} onPress={() => { void photo.pick('library'); }} style={({ pressed }) => [styles.sourceButton, pressed ? styles.pressed : null]}><MaterialIcons name="photo-library" size={24} color={accentColor} /><Text style={styles.label}>Photothèque</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={translate('Fichiers')} onPress={() => { void photo.pick('files'); }} style={({ pressed }) => [styles.sourceButton, pressed ? styles.pressed : null]}><MaterialIcons name="folder-open" size={24} color={accentColor} /><Text style={styles.label}>Fichiers</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={translate('Prendre une photo')} onPress={() => { void photo.pick('camera'); }} style={({ pressed }) => [styles.sourceButton, pressed ? styles.pressed : null]}><MaterialIcons name="photo-camera" size={24} color={accentColor} /><Text style={styles.label}>Prendre une photo</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={photo.closeSources} style={({ pressed }) => [styles.sourceButton, pressed ? styles.pressed : null]}><Text style={styles.removeText}>{t('cancel')}</Text></Pressable>
        </View></SafeAreaView>
      </Modal>
      {photo.error ? <View style={styles.errorRow}><MaterialIcons name="error-outline" size={20} color={Colors.error} /><Text accessibilityLiveRegion="polite" style={styles.error}>{photo.error}</Text></View> : null}
    </View>
  );
});
const styles = StyleSheet.create({
  sourceOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end', padding: Spacing.md },
  sourceSheet: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, gap: Spacing.sm },
  sourceButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.background },
  panel: { gap: Spacing.sm }, label: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 80, height: 80, borderRadius: Radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', borderRadius: Radius.full },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: Radius.full, borderWidth: 2, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  actions: { flex: 1, minWidth: 1, gap: Spacing.xs },
  button: { minHeight: 48, borderWidth: 1, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.sm, backgroundColor: Colors.surface },
  buttonText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  removeButton: { minHeight: 44, justifyContent: 'center' }, removeText: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary }, pressed: { opacity: 0.7 },
  errorRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }, error: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.error, lineHeight: 26 },
});
