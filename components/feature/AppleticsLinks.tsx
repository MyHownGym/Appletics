import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useAppleticsLinks } from '@/hooks/useAppleticsLinks';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface AppleticsLinksProps { accentColor?: string }
export const AppleticsLinks = memo(function AppleticsLinks({ accentColor = Colors.primary }: AppleticsLinksProps) {
  const links = useAppleticsLinks();
  return <View style={styles.links}>
    <Pressable onPress={links.openInstagram} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><FontAwesome name="instagram" size={20} color={Colors.social} /><Text style={[styles.text, { color: Colors.social }]}>@appletics.ch</Text></Pressable>
    <Pressable onPress={links.openWebsite} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><MaterialIcons name="language" size={18} color={accentColor} /><Text style={[styles.text, { color: accentColor }]}>appletics.ch</Text></Pressable>
    <Pressable onPress={links.openEmail} style={({ pressed }) => [styles.button, styles.email, pressed ? styles.pressed : null]}><MaterialIcons name="email" size={18} color={accentColor} /><Text style={[styles.text, { color: accentColor }]}>contact@appletics.ch</Text></Pressable>
  </View>;
});
const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  button: { flexGrow: 1, flexBasis: 140, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, padding: Spacing.sm },
  email: { flexBasis: '100%' }, text: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold }, pressed: { opacity: 0.7 },
});
