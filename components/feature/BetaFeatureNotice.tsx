import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
interface BetaFeatureNoticeProps { kind?: 'overview' | 'chat' | 'club' | 'billing'; }
const descriptions = {
  overview: 'Bêta de test : utilisez des données fictives. Certaines données restent sur cet appareil ; consultez les limites avant de tester.',
  chat: 'Les discussions de vos groupes partagés sont en ligne : tous les membres du groupe les reçoivent. Les autres conversations restent sur cet appareil.',
  club: 'Cet annuaire est local. Il ne crée aucun compte et ne donne aucun accès Cloud aux coachs. Utilisez Groupes partagés pour travailler ensemble.',
  billing: 'Les achats sont désactivés dans la bêta iOS. Aucun paiement ne sera lancé ; les abonnements numériques Apple seront intégrés séparément.',
};
export const BetaFeatureNotice = memo(function BetaFeatureNotice({ kind = 'overview' }: BetaFeatureNoticeProps) {
  const router = useRouter();
  return <View style={styles.card}><View style={styles.row}><MaterialIcons name="science" size={24} color={Colors.welcomeDeep} /><Text style={styles.title}>Bêta Appletics</Text></View><Text style={styles.body}>{descriptions[kind]}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/beta-info')} style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}><Text style={styles.linkText}>Consignes de test</Text><MaterialIcons name="arrow-forward" size={18} color={Colors.welcomeDeep} /></Pressable></View>;
});
const styles = StyleSheet.create({ card: { padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md }, row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }, title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.welcomeDeep }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, includeFontPadding: false }, link: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, linkText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.welcomeDeep }, pressed: { opacity: 0.7 } });
