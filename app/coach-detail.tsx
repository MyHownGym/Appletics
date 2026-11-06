import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCoachDirectory } from '@/hooks/useCoachDirectory';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
export default function CoachDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { coaches, isClub } = useCoachDirectory();
  const { openLink } = useExternalLinks();
  const { maxContentWidth } = useResponsive();
  const coach = coaches.find(item => item.id === id);
  const accent = isClub ? Colors.club : Colors.info;
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.header}><Pressable accessibilityLabel="Retour" style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.headerTitle}>Profil coach</Text></View>
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { maxWidth: maxContentWidth }]}>
      {coach ? <>
        <View style={[styles.hero, Shadow.card, { borderColor: accent + '40' }]}>
          {coach.avatar ? <Image source={{ uri: coach.avatar }} transition={200} contentFit="cover" style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: accent + '12' }]}><MaterialIcons name="sports" size={40} color={accent} /></View>}
          <Text verbatim style={styles.name}>{coach.name}</Text><Text style={[styles.role, { color: accent }]}>{coach.role}</Text><Text verbatim style={styles.body}>{coach.club}</Text>
          {coach.status ? <Text style={styles.body}>{coach.status === 'active' ? 'Actif' : coach.status === 'pending' ? 'En attente' : 'Suspendu'}</Text> : null}
        </View>
        <View style={styles.card}><Text style={styles.title}>{isClub ? 'Informations du club' : 'Groupes partagés'}</Text><Text style={styles.body}>{coach.groups.length ? coach.groups.join(' · ') : 'Aucun groupe renseigné'}</Text>
          {coach.email ? <Pressable style={({ pressed }) => [styles.contact, pressed ? styles.pressed : null]} onPress={() => void openLink(`mailto:${coach.email}`)}><MaterialIcons name="email" size={22} color={accent} /><Text style={[styles.body, { color: accent }]}>{coach.email}</Text></Pressable> : null}
        </View>
        <Text style={styles.body}>{coach.source === 'club' ? 'Fiche locale en lecture seule. Les invitations et accès distants ne sont pas encore connectés.' : 'Profil issu des membres de vos groupes partagés. Seules les informations disponibles dans ces groupes sont affichées.'}</Text>
      </> : <View style={styles.card}><Text style={styles.title}>Coach introuvable</Text><Text style={styles.body}>Ce coach ne fait pas partie de votre club ou de vos groupes partagés.</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  list: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  hero: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderRadius: Radius.xl },
  avatar: { width: 80, height: 80, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  role: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold },
  body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, flexShrink: 1 },
  card: { padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, gap: Spacing.sm, backgroundColor: Colors.surface },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  contact: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pressed: { opacity: 0.7 },
});
