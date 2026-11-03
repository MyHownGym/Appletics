import { memo } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachDirectory } from '@/hooks/useCoachDirectory';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface CoachDirectorySectionProps { compact?: boolean }
export const CoachDirectorySection = memo(function CoachDirectorySection({ compact = false }: CoachDirectorySectionProps) {
  const { coaches, loading, isClub } = useCoachDirectory();
  const router = useRouter();
  const accent = isClub ? Colors.club : Colors.info;
  return <View style={[styles.section, compact ? styles.compact : null]}>
    <View style={styles.heading}><View style={[styles.accent, { backgroundColor: accent }]} /><Text style={styles.title}>{isClub ? 'Coachs du club' : 'Mes coachs'} ({coaches.length})</Text></View>
    <Text style={styles.subtitle}>{isClub ? 'Fiches enregistrées dans la liste locale du club.' : 'Coachs de vos groupes partagés dans l’app.'}</Text>
    {loading ? <ActivityIndicator color={accent} /> : <FlatList scrollEnabled={false} data={coaches} keyExtractor={coach => coach.id} renderItem={({ item: coach }) => <Pressable accessibilityLabel={`Voir le profil de ${coach.name}`} onPress={() => router.push({ pathname: '/coach-detail', params: { id: coach.id } } as any)} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
      {coach.avatar ? <Image source={{ uri: coach.avatar }} contentFit="cover" transition={200} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: accent + '12' }]}><MaterialIcons name="sports" size={24} color={accent} /></View>}
      <View style={styles.info}><Text verbatim style={styles.name}>{coach.name}</Text><Text style={styles.subtitle}>{coach.role}</Text>{coach.status ? <Text style={[styles.subtitle, { color: coach.status === 'active' ? Colors.success : coach.status === 'pending' ? Colors.warning : Colors.error }]}>{coach.status === 'active' ? 'Actif' : coach.status === 'pending' ? 'En attente' : 'Suspendu'}</Text> : null}</View><MaterialIcons name="chevron-right" size={24} color={accent} />
    </Pressable>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="supervisor-account" size={28} color={accent} /><Text style={styles.body}>{isClub ? 'Aucun coach enregistré. Ajoutez une fiche depuis Administration club.' : 'Aucun coach lié à vos groupes pour le moment. Demandez à votre coach de vous ajouter à son groupe dans l’app.'}</Text></View>} />}
  </View>;
});
const styles = StyleSheet.create({
  section: { marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  compact: { marginHorizontal: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  accent: { width: 4, height: 20, borderRadius: Radius.full },
  title: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 21 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  avatar: { width: 48, height: 48, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, minWidth: 1 },
  name: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  empty: { padding: Spacing.md, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, gap: Spacing.sm, backgroundColor: Colors.surface },
  body: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26 },
  pressed: { opacity: 0.7 },
});
