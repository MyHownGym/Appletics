import { memo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { billingTestCards } from '@/constants/billing';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
interface BillingTestGuideProps { compact?: boolean }
export const BillingTestGuide = memo(function BillingTestGuide({ compact = false }: BillingTestGuideProps) {
  return <View style={styles.panel}><Text style={styles.title}>Comment tester</Text><Text style={styles.body}>1. Connectez-vous avec une adresse e-mail réelle.</Text><Text style={styles.body}>2. Choisissez une formule et acceptez les conditions.</Text><Text style={styles.body}>3. Sur iOS ou Android, ouvrez le paiement intégré Stripe. Dans l’aperçu web, le paiement s’ouvre sur la page Stripe.</Text>
    <FlatList scrollEnabled={false} data={billingTestCards} keyExtractor={item => item.number} renderItem={({ item }) => <View style={styles.card}><Text style={styles.label}>{item.label}</Text><Text verbatim selectable style={styles.number}>{item.number}</Text></View>} />
    <Text style={styles.body}>Saisie par carte : date future, CVC 123 et code postal libre. Utilisez uniquement un numéro de test Stripe.</Text>
    <Text style={styles.body}>Pour TWINT, activez ce moyen dans Stripe &gt; Paramètres &gt; Moyens de paiement, puis utilisez la page de simulation Stripe pour autoriser ou refuser le mandat.</Text>
    <Text style={styles.body}>Apple Pay / Google Pay nécessitent un build natif compatible et un portefeuille configuré ; ils ne sont pas disponibles dans Expo Go. Apple Pay nécessite aussi le Merchant ID et le certificat Stripe configurés dans Apple Developer.</Text>
    <Text style={styles.body}>Apple Pay / Google Pay : testez sur un appareil compatible avec un portefeuille configuré. N’y ajoutez pas les cartes de test Stripe ; aucun débit avec une session Stripe de test.</Text>
    <Text style={styles.body}>Les cartes enregistrées apparaissent après un premier paiement avec ce compte. Link s’affiche selon son activation dans Stripe.</Text><Text style={styles.body}>4. Revenez dans l’app puis appuyez sur « Vérifier le paiement ». La formule s’active uniquement après confirmation Stripe.</Text>
    {!compact ? <><Text style={styles.body}>Les tests apparaissent dans Stripe en mode test, pas dans les paiements live.</Text><Text style={styles.body}>Les échéances affichées peuvent être contrôlées dans Stripe &gt; Billing &gt; Abonnements. Les simulations Test clocks séparées ne sont pas reliées au compte de cette app.</Text></> : null}
    <Text style={styles.note}>Tests de développement uniquement. Les règles de paiement App Store / Google Play et les accès partagés du comité restent à traiter avant publication.</Text>
  </View>;
});
const styles = StyleSheet.create({
  panel: { padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary }, body: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, includeFontPadding: false },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm }, label: { color: Colors.textSecondary, fontSize: Typography.fontSizeBase }, number: { color: Colors.welcomeDeep, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold }, note: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary },
});
