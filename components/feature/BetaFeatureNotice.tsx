import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
// Short contextual information card (no beta wording). Kinds without a message render nothing.
interface BetaFeatureNoticeProps { kind?: 'overview' | 'chat' | 'local' | 'club' | 'billing'; }
const descriptions: Partial<Record<NonNullable<BetaFeatureNoticeProps['kind']>, string>> = {
  local: 'Cette conversation reste sur cet appareil. Pour échanger avec vos athlètes, utilisez la discussion d’un groupe.',
  club: 'Cet annuaire reste sur cet appareil. Pour travailler à plusieurs coachs, invitez-les dans un groupe.',
  billing: 'L’abonnement se gère depuis votre compte Appletics.',
};
export const BetaFeatureNotice = memo(function BetaFeatureNotice({ kind = 'overview' }: BetaFeatureNoticeProps) {
  const text = descriptions[kind];
  if (!text) return null;
  return <View style={styles.card}><View style={styles.row}><MaterialIcons name="info-outline" size={22} color={Colors.welcomeDeep} /><Text style={styles.title}>Bon à savoir</Text></View><Text style={styles.body}>{text}</Text></View>;
});
const styles = StyleSheet.create({ card: { padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md }, row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }, title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.welcomeDeep }, body: { fontSize: Typography.fontSizeBase, lineHeight: 24, color: Colors.textSecondary, includeFontPadding: false } });
