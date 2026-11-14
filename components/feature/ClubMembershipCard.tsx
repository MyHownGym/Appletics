import { memo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { getTierConfig } from '@/constants/subscription';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// A coach attached to a club: their plan comes from the club. They can leave and take their own plan.
export const ClubMembershipCard = memo(function ClubMembershipCard({ horizontalPadding }: { horizontalPadding?: number }) {
  const { clubCoach, clubPlan, subscription, leaveClub } = useApp();
  const { showAlert } = useLocalizedAlert();
  const [busy, setBusy] = useState(false);
  if (!clubCoach) return null;
  const clubName = clubPlan.club || 'votre club';
  const level = getTierConfig(subscription).name;
  const confirmLeave = () => showAlert('Quitter le club ?', `Vous ne profiterez plus de la formule de ${clubName}. Votre compte repasse en coach Basic ; vos athlètes et vos plans restent sur votre compte. Vous pourrez ensuite choisir Pro ou Elite.`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Quitter le club', style: 'destructive', onPress: () => {
      setBusy(true);
      leaveClub().then(() => showAlert('Club quitté', 'Votre compte est maintenant en coach Basic. Choisissez une formule quand vous le souhaitez.'))
        .catch(reason => showAlert('Impossible de quitter le club', reason instanceof Error ? reason.message : 'Réessayez.'))
        .finally(() => setBusy(false));
    } },
  ]);
  return <View style={[styles.card, { marginHorizontal: horizontalPadding ?? 0 }]}>
    <View style={styles.row}>
      <View style={styles.icon}><MaterialIcons name="corporate-fare" size={22} color={Colors.club} /></View>
      <View style={{ flex: 1, minWidth: 1 }}>
        <Text style={styles.kicker}>Formule du club</Text>
        <Text verbatim style={styles.title}>{clubName}</Text>
        <Text style={styles.body}>{`Vous profitez du niveau ${level} grâce à votre club. Rien à payer de votre côté.`}</Text>
      </View>
    </View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={confirmLeave} style={({ pressed }) => [styles.leave, pressed || busy ? { opacity: 0.7 } : null]}>
      {busy ? <ActivityIndicator color={Colors.error} /> : <MaterialIcons name="logout" size={18} color={Colors.error} />}
      <Text style={styles.leaveText}>Quitter le club et prendre mon propre abonnement</Text>
    </Pressable>
  </View>;
});
const styles = StyleSheet.create({
  card: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.club + '40', backgroundColor: Colors.club + '0D', gap: Spacing.sm, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.club + '1A' },
  kicker: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.club, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  body: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 21, marginTop: 2 },
  leave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.error + '12' },
  leaveText: { color: Colors.error, fontWeight: Typography.weightBold, fontSize: Typography.fontSizeSM, textAlign: 'center', flexShrink: 1 },
});
