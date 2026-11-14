import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { useBilling } from '@/hooks/useBilling';
import { TRIAL_DAYS } from '@/services/trialService';
import { Radius, Spacing, Typography } from '@/constants/theme';

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long' });

// Countdown of the 30-day free trial (coaches and clubs without a paid plan).
export const TrialBanner = memo(function TrialBanner({ horizontalPadding }: { horizontalPadding?: number }) {
  const { trial, user, clubCoach } = useApp();
  const billing = useBilling();
  const router = useRouter();
  // Wait for the Stripe check: otherwise a paying account sees the trial card flash for a moment.
  if (user.userType === 'athlete' || clubCoach || billing.state.subscribed || !billing.state.checkedAt || billing.loading) return null;
  const urgent = trial.active && trial.daysLeft <= 7;
  const colors: [string, string] = trial.expired ? ['#B91C1C', '#EF4444'] : urgent ? ['#C2410C', '#FB923C'] : ['#E2461A', '#FF8A65'];
  return <Pressable accessibilityRole="button" onPress={() => router.push('/upgrade')} style={({ pressed }) => [{ marginHorizontal: horizontalPadding ?? Spacing.screenPadding, marginBottom: Spacing.md }, pressed ? { opacity: 0.9 } : null]}>
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.row}>
        {trial.active ? <View style={styles.count}>
          <Text verbatim style={styles.countValue}>{String(trial.daysLeft)}</Text>
          <Text style={styles.countLabel}>{trial.daysLeft > 1 ? 'jours' : 'jour'}</Text>
        </View> : <View style={styles.count}><MaterialIcons name="lock-clock" size={30} color="#FFFFFF" /></View>}
        <View style={{ flex: 1, minWidth: 1, gap: 2 }}>
          <Text style={styles.kicker}>{trial.active ? 'Essai gratuit · toutes les fonctions Pro' : 'Essai gratuit terminé'}</Text>
          <Text style={styles.title}>{trial.active ? (urgent ? `Plus que ${trial.daysLeft} jour${trial.daysLeft > 1 ? 's' : ''} d’essai` : `Jusqu’au ${dateLabel(trial.endsAt)}`) : 'Choisis ta formule pour continuer'}</Text>
          <Text style={styles.body}>{trial.active ? 'Sans carte bancaire. Tes données restent à toi.' : 'Tes plans, athlètes et résultats sont conservés.'}</Text>
        </View>
      </View>
      {trial.active ? <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(trial.progress * 100)}%` }]} /></View> : null}
      <View style={styles.cta}><Text style={[styles.ctaText, { color: colors[0] }]}>{trial.active ? 'Voir les formules' : 'Choisir ma formule'}</Text><MaterialIcons name="arrow-forward" size={18} color={colors[0]} /></View>
    </LinearGradient>
  </Pressable>;
});
export const TRIAL_LENGTH_LABEL = `${TRIAL_DAYS} jours`;

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  count: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  countValue: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: '#FFFFFF' },
  countLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.8 },
  kicker: { fontSize: Typography.fontSizeXS, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: Typography.fontSizeLG, fontWeight: '800', color: '#FFFFFF' },
  body: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.88)' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 16, height: 38 },
  ctaText: { fontWeight: '800', fontSize: Typography.fontSizeSM },
});
