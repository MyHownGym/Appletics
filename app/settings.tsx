// Powered by OnSpace.AI
// Settings screen v3 — biometrics, notifications, role change, delete account, payment mgmt
import React, { useCallback, useState } from 'react';
import { useAuth } from '@/template';
import { markManualLock } from '@/services/sessionLock';
import {
  View, ScrollView, Pressable, StyleSheet, Switch,
  Modal, Linking,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBiometricSettings } from '@/hooks/useBiometricSettings';
import { BiometricSettingsPanel } from '@/components/feature/BiometricSettingsPanel';
import { useResponsive } from '@/hooks/useResponsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useAppleticsLinks } from '@/hooks/useAppleticsLinks';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { appleticsLinks } from '@/constants/links';
import { AccountDeletionModal } from '@/components/auth/AccountDeletionModal';
import { useReleasePolicy } from '@/hooks/useReleasePolicy';
import { PushNotificationsPrompt } from '@/components/feature/PushNotificationsPrompt';
import { SwipeSheet } from '@/components/ui/SwipeSheet';

type UserRole = 'coach' | 'athlete' | 'club';

const ROLE_OPTIONS: { id: UserRole; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'coach',   label: 'Coach',              icon: 'sports',         color: '#FF5722', desc: "Créer des plans, gérer les athlètes" },
  { id: 'athlete', label: 'Athlète',            icon: 'directions-run', color: '#1A73E8', desc: "Voir vos entraînements et résultats" },
  { id: 'club',    label: 'Club / Fédération',  icon: 'corporate-fare', color: '#10B981', desc: "Gérer une structure, inviter des coachs" },
];

const NOTIF_GROUPS = [
  {
    title: 'Entraînement',
    items: [
      { key: 'notif_new_plan',          label: 'Nouveau plan créé',            icon: 'event-note',   color: Colors.primary },
      { key: 'notif_session_reminder',  label: 'Rappel de séance (30 min)',    icon: 'alarm',         color: Colors.warning },
      { key: 'notif_plan_updated',      label: 'Plan modifié',                 icon: 'edit',          color: Colors.info },
    ],
  },
  {
    title: 'Compétition',
    items: [
      { key: 'notif_new_competition',      label: 'Nouvelle compétition',      icon: 'emoji-events',  color: '#F59E0B' },
      { key: 'notif_competition_reminder', label: 'Rappel compétition (J-1)',  icon: 'notifications', color: Colors.warning },
      { key: 'notif_result_posted',        label: 'Résultat publié',           icon: 'bar-chart',     color: Colors.success },
    ],
  },
  {
    title: 'Équipe & Chat',
    items: [
      { key: 'notif_new_message',    label: 'Nouveau message chat',     icon: 'chat',       color: '#60A5FA' },
      { key: 'notif_athlete_added',  label: 'Nouvel athlète ajouté',   icon: 'person-add', color: Colors.success },
      { key: 'notif_weekly_summary', label: 'Résumé hebdomadaire',      icon: 'summarize',  color: '#A78BFA' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { showAlert } = useLocalizedAlert();
  const { user, updateUser, notifSettings, setNotifSettings, setLocked, setOnboardingDone, setSubscription } = useApp();
  const { t } = useI18n();
  const links = useAppleticsLinks();
  const { openLink } = useExternalLinks();

  const [roleModal, setRoleModal] = useState(false);
  const [deletionModal, setDeletionModal] = useState(false);
  const closeDeletion = useCallback(() => setDeletionModal(false), []);
  const release = useReleasePolicy();
  const biometric = useBiometricSettings();
  const { maxContentWidth, screenPadding } = useResponsive();

  const currentRole: UserRole = user.accountType === 'club' ? 'club' : (user.userType === 'athlete' ? 'athlete' : 'coach');
  const currentRoleInfo = ROLE_OPTIONS.find(r => r.id === currentRole);

  const handleRoleChange = (role: UserRole) => {
    const roleLabel = t(ROLE_OPTIONS.find(r => r.id === role)?.label || role);
    showAlert(
      'Changer de rôle',
      `Passer à "${roleLabel}" relancera l'onboarding pour reconfigurer votre profil. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Relancer l\'onboarding',
          onPress: async () => {
            setRoleModal(false);
            await AsyncStorage.multiRemove(['@appletics_onboarding_done', '@appletics_user']);
            updateUser({ accountType: 'indie', isClubAdmin: false, userType: 'coach' });
            setSubscription('basic');
            setOnboardingDone(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleToggle = (key: string, value: boolean) => {
    setNotifSettings({ ...notifSettings, [key]: value });
  };

  const handleAllToggle = (value: boolean) => {
    const all = { ...notifSettings };
    NOTIF_GROUPS.forEach(g => g.items.forEach(item => { all[item.key] = value; }));
    setNotifSettings(all);
  };

  const notificationsOnly = useLocalSearchParams<{ section?: string }>().section === 'notifications';
  const allOn = NOTIF_GROUPS.every(g => g.items.every(item => notifSettings[item.key] !== false));

  const handleLogout = () => {
    showAlert('Se déconnecter ?', 'Vous pourrez vous reconnecter avec votre e-mail et votre mot de passe.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => { markManualLock(); void auth.logout(); } },
    ]);
  };

  const handleLockNow = () => {
    markManualLock();
    setLocked(true);
    router.replace('/login');
  };

  const handleManagePayment = () => {
    // Development payments use Stripe test only; this is not an App Store / Google Play purchase.
    router.push('/upgrade');
  };

  const handleDeleteAccount = () => setDeletionModal(true);

  const handleResetOnboarding = () => {
    showAlert(
      "Recommencer l'onboarding",
      "Cela va réinitialiser votre profil et relancer l'onboarding. Continuer ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              '@appletics_onboarding_done',
              '@appletics_user',
              '@appletics_notif',
            ]);
            updateUser({ accountType: 'indie', isClubAdmin: false, userType: 'coach' });
            setSubscription('basic');
            setOnboardingDone(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  if (notificationsOnly) return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: screenPadding }]}>
        <PushNotificationsPrompt />
        <View style={styles.notifHeader}>
          <Text style={styles.sectionLabel}>Rappels et alertes</Text>
          <Pressable
            style={[styles.allToggleBtn, { backgroundColor: allOn ? Colors.primary + '15' : Colors.background }]}
            onPress={() => handleAllToggle(!allOn)}
          >
            <Text style={[styles.allToggleText, { color: allOn ? Colors.primary : Colors.textMuted }]}>
              {allOn ? 'Tout désactiver' : 'Tout activer'}
            </Text>
          </Pressable>
        </View>

        {NOTIF_GROUPS.map((group) => (
          <View key={group.title} style={styles.notifGroup}>
            <Text style={styles.notifGroupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, idx) => {
                const isOn = notifSettings[item.key] !== false;
                return (
                  <View key={item.key}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.row}>
                      <View style={[styles.rowIcon, { backgroundColor: item.color + '18' }]}>
                        <MaterialIcons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <Text style={styles.notifLabel}>{item.label}</Text>
                      <Switch
                        value={isOn}
                        onValueChange={(v) => handleToggle(item.key, v)}
                        trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                        thumbColor={isOn ? Colors.primary : '#FFF'}
                        ios_backgroundColor={Colors.border}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: screenPadding }]}>

        <Text verbatim style={styles.rowValue}>{release.build === 'preview' ? `Appletics ${release.version}` : `Appletics ${release.version} · ${release.build}`}</Text>
        {/* ── COMPTE ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setRoleModal(true)}>
            <View style={[styles.rowIcon, { backgroundColor: (currentRoleInfo?.color || Colors.primary) + '18' }]}>
              <MaterialIcons name={currentRoleInfo?.icon as any} size={20} color={currentRoleInfo?.color || Colors.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Rôle actuel</Text>
              <Text style={styles.rowValue}>{t(currentRoleInfo?.label ?? '')} · {t('Appuyez pour changer')}</Text>
            </View>
            <MaterialIcons name="swap-horiz" size={20} color={Colors.primary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => router.push('/edit-profile')}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '18' }]}>
              <MaterialIcons name="edit" size={20} color={Colors.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('edit_profile')}</Text>
              <Text verbatim style={styles.rowValue}>{user.name}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
          {user.userType !== 'athlete' ? <>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={handleManagePayment}>
            <View style={[styles.rowIcon, { backgroundColor: '#F59E0B18' }]}>
              <MaterialIcons name="credit-card" size={20} color="#F59E0B" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Abonnement & paiement</Text>
              <Text style={styles.rowValue}>{release.externalBillingAllowed ? 'Changer de plan ou de carte bancaire' : 'Votre formule actuelle'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
          </> : null}
        </View>

        {/* ── SÉCURITÉ ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Sécurité</Text>
        <View style={styles.card}>
          <BiometricSettingsPanel biometric={biometric} />
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={handleLockNow}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.textMuted + '18' }]}>
              <MaterialIcons name="exit-to-app" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Verrouiller maintenant</Text>
              <Text style={styles.rowValue}>Retour à l'écran de connexion</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={handleLogout}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.error + '14' }]}>
              <MaterialIcons name="logout" size={20} color={Colors.error} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: Colors.error }]}>Se déconnecter</Text>
              <Text style={styles.rowValue}>Vos données restent sur votre compte</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── NOTIFICATIONS: own page (Profil › Paramètres › Notifications) ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push({ pathname: '/settings', params: { section: 'notifications' } })}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '18' }]}>
              <MaterialIcons name="notifications" size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowValue}>{allOn ? 'Toutes activées' : 'Personnalisées'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── SWISS ATHLETICS ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Swiss Athletics</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.row}
            onPress={() => openLink('https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/')}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#E53E3E18' }]}>
              <Text style={{ fontSize: 18 }}>🇨🇭</Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Inscriptions en ligne</Text>
              <Text style={styles.rowValue}>swiss-athletics.ch</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.info} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => openLink('https://www.swiss-athletics.ch/fr/competitions/resultats/live-results/')}
          >
            <View style={[styles.rowIcon, { backgroundColor: Colors.success + '15' }]}>
              <MaterialIcons name="wifi" size={20} color={Colors.success} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Résultats en direct</Text>
              <Text style={styles.rowValue}>Live results Swiss Athletics</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.success} />
          </Pressable>
        </View>

        {/* ── LÉGAL ──────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Informations légales</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => openLink(appleticsLinks.legal)}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.textMuted + '15' }]}>
              <MaterialIcons name="gavel" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Mentions légales</Text>
              <Text style={styles.rowValue}>Éditeur, hébergement, responsabilités</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => openLink(appleticsLinks.privacy)}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.info + '15' }]}>
              <MaterialIcons name="privacy-tip" size={20} color={Colors.info} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Politique de confidentialité</Text>
              <Text style={styles.rowValue}>Données personnelles, RGPD</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => openLink(appleticsLinks.terms)}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.warning + '15' }]}>
              <MaterialIcons name="description" size={20} color={Colors.warning} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Conditions d'utilisation</Text>
              <Text style={styles.rowValue}>CGU, abonnements, remboursements</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── APPLETICS – RÉSEAUX SOCIAUX ─────────────────────── */}
        <Text style={styles.sectionLabel}>Appletics</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={links.openInstagram}>
            <View style={[styles.rowIcon, { backgroundColor: '#E1306C18' }]}>
              <FontAwesome name="instagram" size={22} color={Colors.social} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Instagram</Text>
              <Text style={styles.rowValue}>@appletics.ch</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color="#E1306C" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={links.openWebsite}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialIcons name="language" size={20} color={Colors.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Site web</Text>
              <Text style={styles.rowValue}>appletics.ch</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.primary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={links.openEmail}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.textMuted + '15' }]}>
              <MaterialIcons name="email" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Nous contacter</Text>
              <Text style={styles.rowValue}>contact@appletics.ch</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── DEV / TEST ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Test & développement</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={handleResetOnboarding}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.warning + '18' }]}>
              <MaterialIcons name="replay" size={20} color={Colors.warning} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Recommencer l'onboarding</Text>
              <Text style={styles.rowValue}>Réinitialise le profil et relance le tutoriel</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── ZONE DANGEREUSE ─────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: Colors.error }]}>Zone dangereuse</Text>
        <View style={[styles.card, { borderColor: Colors.error + '40' }]}>
          <Pressable style={styles.row} onPress={handleDeleteAccount}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.error + '12' }]}>
              <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: Colors.error }]}>Supprimer mon compte</Text>
              <Text style={styles.rowValue}>Suppression définitive et irréversible</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.error} />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <AccountDeletionModal visible={deletionModal} onClose={closeDeletion} />
      {/* ── ROLE MODAL ───────────────────────────────────────── */}
      <Modal visible={roleModal} transparent animationType="slide" onRequestClose={() => setRoleModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setRoleModal(false)}>
          <SwipeSheet onClose={() => setRoleModal(false)} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Changer de profil</Text>
            <Text style={styles.sheetSub}>Cela relancera l'onboarding pour configurer votre nouveau rôle.</Text>
            {ROLE_OPTIONS.map(r => {
              const isActive = r.id === currentRole;
              return (
                <Pressable
                  key={r.id}
                  style={[styles.roleRow, isActive && { backgroundColor: r.color + '10', borderColor: r.color + '40' }]}
                  onPress={() => handleRoleChange(r.id)}
                >
                  <View style={[styles.roleIconWrap, { backgroundColor: r.color + '18' }]}>
                    <MaterialIcons name={r.icon as any} size={22} color={r.color} />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={[styles.roleName, { color: isActive ? r.color : Colors.textPrimary }]}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </View>
                  {isActive
                    ? <MaterialIcons name="check-circle" size={20} color={r.color} />
                    : <MaterialIcons name="chevron-right" size={20} color={Colors.border} />}
                </Pressable>
              );
            })}
            <Text style={styles.sheetNote}>
              Le changement de rôle relancera l'onboarding complet.
            </Text>
          </SwipeSheet>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSizeMD, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120, paddingTop: Spacing.md },
  sectionLabel: { fontSize: Typography.fontSizeXS, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4, marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.lg, overflow: 'hidden',
    ...Shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: Typography.fontSizeBase, fontWeight: '600', color: Colors.textPrimary },
  rowValue: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 4 },
  allToggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  allToggleText: { fontSize: Typography.fontSizeXS, fontWeight: '700' },
  notifGroup: { marginBottom: Spacing.sm },
  notifGroupTitle: { fontSize: Typography.fontSizeXS, fontWeight: '600', color: Colors.textMuted, marginLeft: 4, marginBottom: 6, marginTop: 4 },
  notifLabel: { flex: 1, fontSize: Typography.fontSizeSM, fontWeight: '500', color: Colors.textPrimary },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: Spacing.sm, paddingHorizontal: Spacing.screenPadding, paddingBottom: 48,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.fontSizeLG, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  sheetSub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20, textAlign: 'center' },
  sheetNote: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18 },
  roleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
    borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent',
  },
  roleIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1 },
  roleName: { fontSize: Typography.fontSizeBase, fontWeight: '700' },
  roleDesc: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
});
