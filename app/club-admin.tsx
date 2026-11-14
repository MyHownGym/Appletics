// Powered by OnSpace.AI
// Club Administration Screen — for club admins (Club Basic/Pro/Elite)
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { useI18n } from '@/hooks/useI18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { sendInvitationEmail } from '@/services/inviteEmailService';
import { markClubStaffGroup } from '@/services/clubPlanService';
import { useClubCoachStatusSync } from '@/hooks/useClubCoachStatusSync';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useSubscription } from '@/hooks/useSubscription';
import { getTierConfig, CLUB_TIERS } from '@/constants/subscription';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { ClubCoach as InvitedCoach, CoachStatus, CoachRole } from '@/services/clubCoachService';
import { SubscriptionUpgradeBanner } from '@/components/feature/SubscriptionUpgradeBanner';
import { useHigherPlanNavigation } from '@/hooks/useHigherPlanNavigation';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';

// ── Types ──────────────────────────────────────────────────────────────────


const ROLE_LABELS: Record<CoachRole, string> = {
  head_coach: 'Entraîneur en chef',
  assistant_coach: 'Entraîneur assistant',
  sprint_coach: 'Coach sprint',
  distance_coach: 'Coach demi-fond / fond',
  field_coach: 'Coach lancers / sauts',
  admin: 'Administrateur',
};

const ROLE_ICONS: Record<CoachRole, string> = {
  head_coach: 'sports',
  assistant_coach: 'person',
  sprint_coach: 'bolt',
  distance_coach: 'directions-run',
  field_coach: 'flag',
  admin: 'admin-panel-settings',
};

const STATUS_COLORS: Record<CoachStatus, string> = {
  active: Colors.success,
  pending: '#F59E0B',
  suspended: Colors.error,
};

const STATUS_LABELS: Record<CoachStatus, string> = {
  active: 'Actif',
  pending: 'En attente',
  suspended: 'Suspendu',
};


// ── CoachRow component ─────────────────────────────────────────────────────
function CoachRow({
  coach,
  onRevoke,
  onSuspend,
  onRestore,
  isAdmin,
}: {
  coach: InvitedCoach;
  onRevoke: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = coach.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const statusColor = STATUS_COLORS[coach.status];
  const accentColor = '#10B981';

  return (
    <View style={rowStyles.wrap}>
      <View style={rowStyles.left}>
        <View style={[rowStyles.avatar, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}>
          <Text style={[rowStyles.initials, { color: accentColor }]}>{initials}</Text>
        </View>
        <View style={rowStyles.info}>
          <View style={rowStyles.nameRow}>
            <Pressable accessibilityLabel={`Voir le profil de ${coach.name}`} onPress={() => router.push({ pathname: '/coach-detail', params: { id: coach.id } } as any)} style={({ pressed }) => [{ minHeight: 48, justifyContent: 'center', flexShrink: 1 }, pressed ? { opacity: 0.7 } : null]}><Text verbatim style={rowStyles.name}>{coach.name}</Text></Pressable>
            {coach.status === 'pending' ? (
              <View style={rowStyles.pendingBadge}>
                <MaterialIcons name="schedule" size={10} color="#F59E0B" />
                <Text style={rowStyles.pendingText}>En attente</Text>
              </View>
            ) : null}
          </View>
          <Text style={rowStyles.email} numberOfLines={1}>{coach.email}</Text>
          <View style={rowStyles.roleBadge}>
            <MaterialIcons name={ROLE_ICONS[coach.role] as any} size={11} color={accentColor} />
            <Text style={rowStyles.roleLabel}>{ROLE_LABELS[coach.role]}</Text>
          </View>
          <Text style={rowStyles.date}>Invité le {coach.invitedAt}</Text>
        </View>
      </View>

      <View style={rowStyles.right}>
        {/* Status dot */}
        <View style={[rowStyles.statusDot, { backgroundColor: statusColor }]} />

        {/* Actions menu */}
        {isAdmin ? (
          <Pressable
            style={rowStyles.menuBtn}
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
          >
            <MaterialIcons name="more-vert" size={20} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Inline action menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={rowStyles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={rowStyles.menuSheet}>
            <View style={rowStyles.menuHandle} />
            <Text style={rowStyles.menuTitle}>{coach.name}</Text>
            <Text style={rowStyles.menuSub}>{coach.email}</Text>

            {coach.status === 'active' ? (
              <Pressable
                style={rowStyles.menuItem}
                onPress={() => { setMenuOpen(false); onSuspend(); }}
              >
                <View style={[rowStyles.menuIcon, { backgroundColor: Colors.warning + '15' }]}>
                  <MaterialIcons name="pause-circle" size={18} color={Colors.warning} />
                </View>
                <View style={rowStyles.menuItemInfo}>
                  <Text style={rowStyles.menuItemLabel}>Suspendre l'accès</Text>
                  <Text style={rowStyles.menuItemSub}>Marquer cette fiche locale comme suspendue</Text>
                </View>
              </Pressable>
            ) : null}

            {coach.status === 'suspended' ? (
              <Pressable
                style={rowStyles.menuItem}
                onPress={() => { setMenuOpen(false); onRestore(); }}
              >
                <View style={[rowStyles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
                  <MaterialIcons name="play-circle" size={18} color={Colors.success} />
                </View>
                <View style={rowStyles.menuItemInfo}>
                  <Text style={rowStyles.menuItemLabel}>Restaurer l'accès</Text>
                  <Text style={rowStyles.menuItemSub}>Marquer cette fiche locale comme active</Text>
                </View>
              </Pressable>
            ) : null}

            <View style={rowStyles.menuDivider} />

            <Pressable
              style={rowStyles.menuItem}
              onPress={() => { setMenuOpen(false); onRevoke(); }}
            >
              <View style={[rowStyles.menuIcon, { backgroundColor: Colors.error + '15' }]}>
                <MaterialIcons name="person-remove" size={18} color={Colors.error} />
              </View>
              <View style={rowStyles.menuItemInfo}>
                <Text style={[rowStyles.menuItemLabel, { color: Colors.error }]}>Retirer du club</Text>
                <Text style={rowStyles.menuItemSub}>Retirer cette fiche de la liste locale du club</Text>
              </View>
            </Pressable>

            <Pressable
              style={[rowStyles.menuItem, rowStyles.cancelItem]}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={rowStyles.cancelText}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F59E0B18', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#F59E0B40' },
  pendingText: { fontSize: 9, color: '#F59E0B', fontWeight: Typography.weightBold },
  email: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleLabel: { fontSize: Typography.fontSizeXS, color: '#10B981', fontWeight: Typography.weightSemibold },
  date: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 9, height: 9, borderRadius: 4.5 },
  menuBtn: { padding: 4 },
  // Menu modal
  menuOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: 36, paddingTop: Spacing.sm,
  },
  menuHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  menuTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  menuSub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuItemInfo: { flex: 1 },
  menuItemLabel: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  menuItemSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  cancelItem: { justifyContent: 'center', marginTop: Spacing.xs },
  cancelText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, textAlign: 'center' },
});

// ── Invite Modal ───────────────────────────────────────────────────────────
function InviteModal({
  visible,
  onClose,
  onSend,
  onUpgrade,
  onDismiss,
  coachQuota,
  usedQuota,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (name: string, email: string, role: CoachRole) => void;
  onUpgrade: () => void;
  onDismiss: () => void;
  coachQuota: number;
  usedQuota: number;
}) {
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CoachRole>('assistant_coach');
  const isQuotaFull = coachQuota !== -1 && usedQuota >= coachQuota;
  const accentColor = '#10B981';

  const handleSend = () => {
    if (!email.trim()) {
      showAlert('Champ requis', 'Veuillez saisir l\'adresse e-mail du coach.');
      return;
    }
    if (!email.includes('@')) {
      showAlert('E-mail invalide', 'Veuillez saisir une adresse e-mail valide.');
      return;
    }
    onSend(name.trim() || email.split('@')[0], email.trim().toLowerCase(), role);
    setName(''); setEmail(''); setRole('assistant_coach');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={onDismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={invStyles.overlay} onPress={onClose}>
          <Pressable style={invStyles.sheet} onPress={() => {}}>
            <View style={invStyles.handle} />
            <Text style={invStyles.title}>Ajouter un coach au club</Text>
            <Text style={invStyles.sub}>
              {isQuotaFull
                ? `Quota atteint (${usedQuota}/${coachQuota}). Passez à un plan supérieur pour inviter plus de coachs.`
                : `${usedQuota}/${coachQuota === -1 ? '∞' : coachQuota} coach${usedQuota > 1 ? 's' : ''} invité${usedQuota > 1 ? 's' : ''}`
              }
            </Text>

            {isQuotaFull ? null : (
              <>
                <View style={invStyles.field}>
                  <Text style={invStyles.label}>Nom complet <Text style={invStyles.optional}>(optionnel)</Text></Text>
                  <TextInput
                    style={invStyles.input}
                    placeholder="Jean Dupont"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={invStyles.field}>
                  <Text style={invStyles.label}>Adresse e-mail *</Text>
                  <TextInput
                    style={invStyles.input}
                    placeholder="coach@club.ch"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={invStyles.field}>
                  <Text style={invStyles.label}>Rôle</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={invStyles.roleRow}>
                    {(Object.keys(ROLE_LABELS) as CoachRole[]).map(r => (
                      <Pressable
                        key={r}
                        style={[invStyles.roleChip, role === r && { backgroundColor: accentColor, borderColor: accentColor }]}
                        onPress={() => setRole(r)}
                      >
                        <MaterialIcons name={ROLE_ICONS[r] as any} size={13} color={role === r ? '#FFF' : accentColor} />
                        <Text style={[invStyles.roleChipText, role === r && { color: '#FFF' }]}>{ROLE_LABELS[r]}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={invStyles.noteRow}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
                  <Text style={invStyles.noteText}>
                    Le coach reçoit un e-mail d’invitation. Il crée son compte avec cette adresse, accepte l’invitation et rejoint le groupe des coachs du club.
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [invStyles.sendBtn, { backgroundColor: accentColor }, pressed && { opacity: 0.85 }]}
                  onPress={handleSend}
                >
                  <MaterialIcons name="send" size={18} color="#FFF" />
                  <Text style={invStyles.sendBtnText}>Envoyer l’invitation</Text>
                </Pressable>
              </>
            )}

            {isQuotaFull ? (
              <Pressable accessibilityLabel="Voir les formules Club supérieures" style={({ pressed }) => [invStyles.sendBtn, { backgroundColor: Colors.club }, pressed ? { opacity: 0.75 } : null]} onPress={onUpgrade}>
                <MaterialIcons name="workspace-premium" size={18} color="#FFF" />
                <Text style={invStyles.sendBtnText}>Voir les plans supérieurs</Text>
              </Pressable>
            ) : null}

            <Pressable style={invStyles.cancelBtn} onPress={onClose}>
              <Text style={invStyles.cancelText}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const invStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.screenPadding, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  field: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 6 },
  optional: { fontWeight: Typography.weightMedium, color: Colors.textMuted },
  input: { backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  roleRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#10B981', backgroundColor: '#10B98108' },
  roleChipText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, color: '#10B981' },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  noteText: { flex: 1, fontSize: Typography.fontSizeXS, color: Colors.textMuted, lineHeight: 18 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.full, paddingVertical: 14, marginBottom: Spacing.sm },
  sendBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold, color: '#FFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },
});

// ── Main Screen ────────────────────────────────────────────────────────────

export default function ClubAdminScreen() {
  const router = useRouter();
  const { user, subscription } = useApp();
  const { t, locale, language } = useI18n();
  const { hasFeature } = useSubscription();
  const ensureQuota = useSubscriptionQuota();

  const { coaches, loading, addCoach, removeCoach, updateCoachStatus } = useClubCoaches();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{ invite?: string }>();
  // Opened from the profile's « Ajouter un coach » button: the form shows right away.
  const [showInviteModal, setShowInviteModal] = useState(params.invite === '1');
  const shared = useSharedGroups();
  useClubCoachStatusSync();
  const higherPlan = useHigherPlanNavigation();
  const [activeFilter, setActiveFilter] = useState<'all' | CoachStatus>('all');

  // Gate: requires club subscription and club_admin feature
  const isClubAdmin = user.isClubAdmin || user.accountType === 'club';

  const tierConfig = getTierConfig(subscription);
  const coachQuota = tierConfig.limits.coaches; // -1 = unlimited
  const usedQuota = coaches.filter(c => c.status !== 'suspended').length;
  const pendingCount = coaches.filter(c => c.status === 'pending').length;
  const activeCount = coaches.filter(c => c.status === 'active').length;
  const isQuotaFull = coachQuota !== -1 && usedQuota >= coachQuota;

  const filteredCoaches = activeFilter === 'all'
    ? coaches
    : coaches.filter(c => c.status === activeFilter);

  // The club's staff group (« <club> · Coachs »), created the first time a coach is invited.
  // Each invited coach gets a real e-mail; once they create their account with that address and
  // accept, they join this group with the club.
  const staffGroupName = `${(user.club && user.club !== 'Athletics Club' ? user.club : 'Mon club').trim()} · Coachs`;
  const ensureStaffGroup = async (): Promise<string> => {
    const existing = shared.data.groups.find(group => group.name === staffGroupName && group.owner_id === shared.userId);
    const id = existing ? existing.id : await shared.operate<string>('shared_create_group', { p_name: staffGroupName });
    // Marks it as the club's coach group: its coaches then follow the club plan (SQL n° 18).
    await markClubStaffGroup(id).catch(() => {});
    return id;
  };
  const handleInvite = async (name: string, email: string, role: CoachRole) => {
    if (!ensureQuota('coaches', usedQuota)) return;
    const address = email.trim().toLowerCase();
    const today = new Date().toLocaleDateString(locale);
    const newCoach: InvitedCoach = { id: `coach-${Date.now()}`, name: name || address.split('@')[0], email: address, role, status: 'pending', invitedAt: today };
    if (!addCoach(newCoach)) { showAlert('Coach non ajouté', 'La liste est en cours de chargement ou cette adresse e-mail est déjà présente.'); return; }
    try {
      const groupId = await ensureStaffGroup();
      const invitationId = await shared.operate<string>('shared_invite', { p_group: groupId, p_email: address, p_role: 'coach' });
      void shared.refresh();
      const failure = await sendInvitationEmail(invitationId, language);
      if (failure) showAlert('Coach ajouté', `L’e-mail n’est pas parti (${failure}). Envoyez-lui ce lien : https://app.appletics.ch — il doit créer son compte avec ${address}.`);
      else showAlert('Invitation envoyée', `${address} a reçu un e-mail. Dès qu’il aura créé son compte avec cette adresse et accepté l’invitation, il rejoindra « ${staffGroupName} ».`);
    } catch (reason) {
      showAlert('Coach ajouté sans e-mail', `La fiche est enregistrée, mais l’invitation n’a pas pu être envoyée (${reason instanceof Error ? reason.message : 'connexion'}). Vérifiez que vous êtes connecté, puis réessayez.`);
    }
  };

  const handleRevoke = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    showAlert(
      'Retirer du club',
      `Êtes-vous sûr de vouloir retirer ${coach?.name} du club ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: () => removeCoach(coachId),
        },
      ]
    );
  };

  const handleSuspend = (coachId: string) => {
    updateCoachStatus(coachId, 'suspended');
  };

  const handleRestore = (coachId: string) => {
    if (!ensureQuota('coaches', usedQuota)) return;
    updateCoachStatus(coachId, 'active');
  };

  // ── Gate: not a club admin ────────────────────────────────────────────────
  if (!isClubAdmin) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Administration club</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.gateWrap}>
          <View style={styles.gateIconWrap}>
            <MaterialIcons name="corporate-fare" size={44} color="#10B981" />
          </View>
          <Text style={styles.gateTitle}>Réservé aux clubs</Text>
          <Text style={styles.gateSub}>
            L'administration club est disponible pour les responsables de clubs disposant d'un abonnement Club Basic, Pro ou Elite.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.gateBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/upgrade', params: { track: 'club', reason: "Administration club requiert un abonnement Club" } } as any)}
          >
            <MaterialIcons name="corporate-fare" size={18} color="#FFF" />
            <Text style={styles.gateBtnText}>Voir les plans Club</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Club tier info ─────────────────────────────────────────────────────────
  const clubTier = CLUB_TIERS.find(t => t.id === subscription) || CLUB_TIERS[0];
  const accentColor = '#10B981';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGrad}>
        <Pressable onPress={() => router.back()} style={styles.backBtnWhite} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleWhite}>Administration club</Text>
          <View style={styles.clubBadge}>
            <MaterialIcons name="corporate-fare" size={11} color="#FFF" />
            <Text style={styles.clubBadgeText}>{clubTier.badge}</Text>
          </View>
        </View>
        <Pressable
          style={styles.inviteHeaderBtn}
          onPress={() => setShowInviteModal(true)}
          hitSlop={4}
        >
          <MaterialIcons name="person-add" size={20} color="#FFF" />
        </Pressable>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.localNote}>Les coachs invités reçoivent un e-mail et rejoignent le groupe des coachs du club une fois leur compte créé.</Text>
        {loading ? <Text style={styles.localNote}>Chargement des coachs enregistrés…</Text> : null}

        {/* Club info card */}
        <View style={[styles.clubCard, Shadow.card]}>
          <View style={styles.clubInfo}>
            <View style={[styles.clubIconWrap, { backgroundColor: accentColor + '15' }]}>
              <MaterialIcons name="corporate-fare" size={28} color={accentColor} />
            </View>
            <View style={styles.clubDetails}>
              <Text verbatim style={styles.clubName}>{user.club || 'Mon Club'}</Text>
              <Text verbatim style={styles.clubAdmin}>{user.name} · {t(user.role ? (user.role === 'president' ? 'Président(e)' : user.role === 'vice_president' ? 'Vice-président(e)' : user.role === 'secretary' ? 'Secrétaire général(e)' : user.role === 'treasurer' ? 'Trésorier(ère)' : user.role === 'technical_dir' ? 'Directeur/rice technique' : user.role === 'competition_dir' ? 'Resp. compétitions' : user.role === 'youth_dir' ? 'Resp. jeunesse' : 'Administrateur') : 'Administrateur')}</Text>
              {user.email ? <Text style={styles.clubEmail}>{user.email}</Text> : null}
            </View>
          </View>

          {/* Quota bar */}
          <View style={styles.quotaSection}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaLabel}>Quota coachs invités</Text>
              <Text style={[styles.quotaCount, { color: isQuotaFull ? Colors.error : accentColor }]}>
                {usedQuota} / {coachQuota === -1 ? '∞' : coachQuota}
              </Text>
            </View>
            {coachQuota !== -1 ? (
              <View style={styles.quotaBarWrap}>
                <View
                  style={[
                    styles.quotaBarFill,
                    {
                      width: `${Math.min(100, (usedQuota / Math.max(1, coachQuota)) * 100)}%`,
                      backgroundColor: isQuotaFull ? Colors.error : accentColor,
                    },
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.quotaUnlimited}>Illimité — plan {clubTier.name}</Text>
            )}
            {isQuotaFull ? (
              <Pressable
                style={styles.quotaUpgradeRow}
                onPress={higherPlan.goToHigherPlan}
              >
                <MaterialIcons name="arrow-upward" size={13} color={Colors.primary} />
                <Text style={styles.quotaUpgradeText}>Passer à un plan supérieur pour inviter plus de coachs</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Summary chips */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total', count: coaches.length, color: Colors.textSecondary, icon: 'group' },
            { label: 'Actifs', count: activeCount, color: Colors.success, icon: 'check-circle' },
            { label: 'En attente', count: pendingCount, color: '#F59E0B', icon: 'schedule' },
          ].map(s => (
            <View key={s.label} style={[styles.summaryChip, { borderColor: s.color + '30', backgroundColor: s.color + '08' }]}>
              <MaterialIcons name={s.icon as any} size={16} color={s.color} />
              <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
              <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {([
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'pending', label: 'En attente' },
            { id: 'suspended', label: 'Suspendus' },
          ] as { id: 'all' | CoachStatus; label: string }[]).map(f => (
            <Pressable
              key={f.id}
              style={[styles.filterChip, activeFilter === f.id && { backgroundColor: accentColor, borderColor: accentColor }]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterChipText, activeFilter === f.id && { color: '#FFF' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Coaches list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>
              {t('coaches')} {activeFilter !== 'all' ? `· ${t(STATUS_LABELS[activeFilter as CoachStatus])}` : `(${filteredCoaches.length})`}
            </Text>
            <Pressable
              style={[styles.inviteBtn, { backgroundColor: accentColor }, isQuotaFull && { backgroundColor: Colors.textMuted }]}
              onPress={() => setShowInviteModal(true)}
            >
              <MaterialIcons name="person-add" size={14} color="#FFF" />
              <Text style={styles.inviteBtnText}>Inviter</Text>
            </Pressable>
          </View>

          {filteredCoaches.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons name="group-add" size={36} color={accentColor} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? t('Aucun coach invité') : `${t('Aucun coach invité')} · ${t(STATUS_LABELS[activeFilter as CoachStatus])}`}
              </Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'all'
                  ? 'Invitez vos coachs par e-mail : ils rejoignent le groupe des coachs du club dès leur compte créé.'
                  : 'Modifiez le filtre pour voir d\'autres coachs.'}
              </Text>
              {activeFilter === 'all' ? (
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: accentColor }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <MaterialIcons name="person-add" size={16} color="#FFF" />
                  <Text style={styles.emptyBtnText}>Inviter un coach</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            filteredCoaches.map(coach => (
              <CoachRow
                key={coach.id}
                coach={coach}
                isAdmin={true}
                onRevoke={() => handleRevoke(coach.id)}
                onSuspend={() => handleSuspend(coach.id)}
                onRestore={() => handleRestore(coach.id)}
              />
            ))
          )}
        </View>

        <SubscriptionUpgradeBanner />

        <View style={{ height: 40 }} />
      </ScrollView>

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSend={handleInvite}
        onUpgrade={() => {
          if (higherPlan.nextPlan) higherPlan.openAfterClose(() => setShowInviteModal(false));
          else { setShowInviteModal(false); }
        }}
        onDismiss={higherPlan.onModalDismiss}
        coachQuota={coachQuota}
        usedQuota={usedQuota}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  localNote: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, marginBottom: Spacing.md },

  // Gate
  gateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding, paddingBottom: 60, gap: 16 },
  gateIconWrap: { width: 88, height: 88, borderRadius: 26, backgroundColor: '#10B98115', borderWidth: 2, borderColor: '#10B98130', alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, textAlign: 'center' },
  gateSub: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#10B981', borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 13 },
  gateBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold, color: '#FFF' },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: Radius.sm },
  headerTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },
  headerGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md },
  backBtnWhite: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 3 },
  headerTitleWhite: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: '#FFF' },
  clubBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  clubBadgeText: { fontSize: 10, color: '#FFF', fontWeight: Typography.weightExtrabold },
  inviteHeaderBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full },

  scroll: { padding: Spacing.screenPadding, paddingBottom: 60 },

  // Club card
  clubCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  clubInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  clubIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  clubDetails: { flex: 1, gap: 3 },
  clubName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary },
  clubAdmin: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  clubEmail: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  quotaSection: { gap: 8 },
  quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  quotaCount: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightExtrabold },
  quotaBarWrap: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  quotaBarFill: { height: 8, borderRadius: 4 },
  quotaUnlimited: { fontSize: Typography.fontSizeXS, color: '#10B981', fontWeight: Typography.weightSemibold },
  quotaUpgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quotaUpgradeText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.weightSemibold, flex: 1 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryChip: { flex: 1, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.sm, gap: 3 },
  summaryCount: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold },
  summaryLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold },

  // Filter
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterChipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },

  // Section
  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#10B981' },
  sectionTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  inviteBtnText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: '#FFF' },

  // Empty
  emptyWrap: { alignItems: 'center', gap: 12, paddingVertical: 40, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyIconWrap: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#10B98110', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textSecondary },
  emptySub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.lg },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },

  // Upgrade banner
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: '#8B5CF615', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#8B5CF630', marginBottom: Spacing.md },
  upgradeIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#8B5CF615', alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#8B5CF6' },
  upgradeSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
});
