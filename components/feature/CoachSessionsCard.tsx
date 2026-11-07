import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const label = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Demain';
  return date.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Athlete home: next sessions sent by the coach (shared groups where this account is an athlete).
export const CoachSessionsCard = memo(function CoachSessionsCard({ horizontalPadding = 0 }: { horizontalPadding?: number }) {
  const router = useRouter();
  const { data, userId } = useSharedGroups();
  const athleteGroups = useMemo(() => new Set(data.members.filter(item => item.user_id === userId && item.role === 'athlete').map(item => item.group_id)), [data.members, userId]);
  const today = new Date(); const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcoming = useMemo(() => data.sessions.filter(item => athleteGroups.has(item.group_id) && item.session_date >= key).sort((a, b) => a.session_date.localeCompare(b.session_date)).slice(0, 6), [data.sessions, athleteGroups, key]);
  if (!athleteGroups.size) return null;
  return <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
    <Text style={styles.heading}>Séances de mon coach</Text>
    {upcoming.length ? upcoming.map(item => (
      <Pressable key={item.id} accessibilityRole="button" onPress={() => (item.kind ?? 'session') === 'competition' ? router.push({ pathname: '/competition-detail', params: { id: `shared-comp-${item.id}` } }) : router.push({ pathname: '/session-edit', params: { planId: `shared-plan-${item.group_id}`, sessionId: `ss-${item.id}` } })} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
        <View style={styles.dateBadge}><MaterialIcons name={(item.kind ?? 'session') === 'competition' ? 'emoji-events' : 'event'} size={20} color={Colors.primary} /></View>
        <View style={styles.text}>
          <Text verbatim style={styles.date}>{label(item.session_date)}</Text>
          <Text verbatim style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.details ? <Text verbatim style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
      </Pressable>
    )) : <View style={styles.empty}><Text style={styles.details}>Aucune séance prévue pour l’instant. Votre coach vous les enverra ici.</Text></View>}
  </View>;
});
const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm, marginBottom: Spacing.md },
  heading: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  dateBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  text: { flex: 1, gap: 2 },
  date: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.primary, textTransform: 'capitalize' },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  details: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  empty: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border },
  pressed: { opacity: 0.75 },
});
