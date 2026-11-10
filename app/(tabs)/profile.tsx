// Powered by OnSpace.AI
// v10 — club/committee read-only view, role-appropriate content, no cross-contamination
import React, { useState, useRef, useMemo } from 'react';
import {
  View, ScrollView, FlatList, Pressable, StyleSheet, Modal,
  Animated, PanResponder, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useResponsive } from '@/hooks/useResponsive';
import { EVENT_GROUPS } from '@/constants/config';
import { LANGUAGES, Language } from '@/constants/i18n';
import { SUBSCRIPTION_TIERS } from '@/constants/subscription';
import { Athlete } from '@/types';
import { PerformanceChart } from '@/components/feature/PerformanceChart';
import { AthleteStatusSummary } from '@/components/feature/AthleteStatusSummary';
import { SubscriptionUpgradeBanner } from '@/components/feature/SubscriptionUpgradeBanner';
import { AppleticsLinks } from '@/components/feature/AppleticsLinks';
import { CoachDirectorySection } from '@/components/feature/CoachDirectorySection';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useProfileSectionNavigation } from '@/hooks/useProfileSectionNavigation';
import { AvatarPhoto } from '@/components/ui/AvatarPhoto';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { parsePerf, isDistanceEvent, sortResultsChronologically } from '@/services/athletePerformanceService';
import { getAthleteSearchUrl } from '@/services/swissAthleticsService';
import { useCoachRoles } from '@/hooks/useCoachRoles';
import { AppBrand } from '@/components/feature/AppBrand';
import { SubscriptionPlanCard } from '@/components/feature/SubscriptionPlanCard';
import { SharedGroupsLink } from '@/components/feature/SharedGroupsLink';
import { SwipeSheet } from '@/components/ui/SwipeSheet';

const DELETE_WIDTH = 76;

// ── SwipeableAthleteRow ────────────────────────────────────────────────────
function SwipeableAthleteRow({ athlete, onPress, onDelete }: {
  athlete: Athlete; onPress: () => void; onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 15,
    onPanResponderMove: (_, g) => {
      const dx = Math.max(-DELETE_WIDTH, Math.min(0, g.dx + (isOpen ? -DELETE_WIDTH : 0)));
      translateX.setValue(dx);
    },
    onPanResponderRelease: (_, g) => {
      const shouldOpen = g.dx < -DELETE_WIDTH / 2 || (isOpen && g.dx < 0);
      Animated.spring(translateX, { toValue: shouldOpen ? -DELETE_WIDTH : 0, useNativeDriver: true }).start();
      setIsOpen(shouldOpen);
    },
  })).current;

  const group = EVENT_GROUPS.find(g => g.id === athlete.group);
  const color = group?.color || Colors.primary;
  const initials = athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const statusColors = { active: Colors.success, injured: Colors.error, inactive: Colors.textMuted };

  return (
    <View style={atStyles.swipeWrap}>
      <View style={atStyles.deleteWrap}>
        <Pressable style={atStyles.deleteBtn} onPress={onDelete}>
          <MaterialIcons name="delete" size={20} color="#FFF" />
        </Pressable>
      </View>
      <Animated.View style={[atStyles.rowAnimated, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Pressable style={atStyles.row} onPress={() => {
          if (isOpen) { Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(); setIsOpen(false); }
          else onPress();
        }}>
          <View style={[atStyles.avatar, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <Text style={[atStyles.avatarText, { color }]}>{initials}</Text>
            <AvatarPhoto uri={athlete.avatar} />
          </View>
          <View style={atStyles.info}>
            <Text style={atStyles.name}>{athlete.name}</Text>
            <Text style={atStyles.events}>{athlete.events.slice(0, 2).join(' · ')}</Text>
          </View>
          <View style={[atStyles.statusDot, { backgroundColor: statusColors[athlete.status] }]} />
          <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const atStyles = StyleSheet.create({
  swipeWrap: { marginBottom: 6, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  deleteWrap: { position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_WIDTH, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { alignItems: 'center', justifyContent: 'center', flex: 1, width: DELETE_WIDTH },
  rowAnimated: { backgroundColor: Colors.background },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  info: { flex: 1 },
  name: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  events: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});

// ── Athlete Progression View ───────────────────────────────────────────────
function AthleteProgressionView({ athleteId }: { athleteId: string }) {
  const { openLink } = useExternalLinks();
  const { t } = useI18n();
  const { athletes, results, competitions } = useApp();
  const router = useRouter();
  const athlete = athletes.find(a => a.id === athleteId);
  if (!athlete) return null;

  const athleteResults = results.filter(r => r.athleteId === athlete.id);
  const eventsWithResults = [...new Set(athleteResults.map(r => r.event))];
  const group = EVENT_GROUPS.find(g => g.id === athlete.group);
  const accentColor = group?.color || Colors.primary;
  const wins = athleteResults.filter(r => r.rank === 1).length;
  const pbs = athleteResults.filter(r => r.pb).length;
  const currentYear = new Date().getFullYear();
  const currentSeason = athleteResults.filter(r => {
    const comp = competitions.find(c => c.id === r.competitionId);
    return comp ? new Date(comp.date).getFullYear() === currentYear : false;
  });

  return (
    <View>
      <View style={[progStyles.kpiRow, Shadow.card]}>
        <View style={progStyles.kpiItem}><Text style={[progStyles.kpiVal, { color: accentColor }]}>{athleteResults.length}</Text><Text style={progStyles.kpiLabel}>Résultats</Text></View>
        <View style={progStyles.kpiDiv} />
        <View style={progStyles.kpiItem}><Text style={[progStyles.kpiVal, { color: '#F59E0B' }]}>{pbs}</Text><Text style={progStyles.kpiLabel}>PBs</Text></View>
        <View style={progStyles.kpiDiv} />
        <View style={progStyles.kpiItem}><Text style={[progStyles.kpiVal, { color: Colors.success }]}>{wins}</Text><Text style={progStyles.kpiLabel}>Victoires</Text></View>
        <View style={progStyles.kpiDiv} />
        <View style={progStyles.kpiItem}><Text style={[progStyles.kpiVal, { color: Colors.info }]}>{currentSeason.length}</Text><Text style={progStyles.kpiLabel}>{currentYear}</Text></View>
      </View>

      <View style={progStyles.sectionHeader}>
        <MaterialIcons name="star" size={14} color="#F59E0B" />
        <Text style={progStyles.sectionTitle}>Records personnels</Text>
      </View>
      {Object.keys(athlete.pb).length === 0 ? (
        <View style={progStyles.emptyBox}><Text style={progStyles.emptyText}>Aucun record enregistré</Text></View>
      ) : (
        <View style={progStyles.pbCard}>
          {Object.entries(athlete.pb).map(([event, perf], idx, arr) => (
            <View key={event}>
              <View style={progStyles.pbRow}>
                <View style={[progStyles.pbDot, { backgroundColor: accentColor }]} />
                <Text style={progStyles.pbEvent}>{event}</Text>
                <Text style={[progStyles.pbPerf, { color: accentColor }]}>{perf}</Text>
                <View style={progStyles.pbBadge}><MaterialIcons name="star" size={10} color="#F59E0B" /><Text style={progStyles.pbBadgeText}>PB</Text></View>
              </View>
              {idx < arr.length - 1 ? <View style={progStyles.divider} /> : null}
            </View>
          ))}
        </View>
      )}

      {eventsWithResults.length > 0 ? (
        <>
          <View style={progStyles.sectionHeader}>
            <MaterialIcons name="show-chart" size={14} color={accentColor} />
            <Text style={progStyles.sectionTitle}>Évolution par épreuve</Text>
          </View>
          {eventsWithResults.map(event => {
            const evResults = sortResultsChronologically(athleteResults.filter(r => r.event === event), competitions);
            const values = evResults.map(r => parsePerf(r.result)).filter((v): v is number => v !== null);
            const isDist = isDistanceEvent(event);
            const lastResult = evResults[evResults.length - 1];
            const firstResult = evResults[0];
            if (values.length === 0) return null;
            const improved = values.length >= 2 ? (isDist ? values[values.length - 1] > values[0] : values[values.length - 1] < values[0]) : null;
            return (
              <View key={event} style={[progStyles.sparkCard, Shadow.card]}>
                <View style={progStyles.sparkHeader}>
                  <Text style={progStyles.sparkEvent}>{event}</Text>
                  <View style={[progStyles.sparkBadge, { backgroundColor: (improved === null ? Colors.textMuted : improved ? Colors.success : Colors.error) + '15' }]}>
                    {improved !== null ? <MaterialIcons name={improved ? 'trending-up' : 'trending-down'} size={14} color={improved ? Colors.success : Colors.error} /> : null}
                    <Text style={[progStyles.sparkBadgeText, { color: improved === null ? Colors.textMuted : improved ? Colors.success : Colors.error }]}>{evResults.length} résultat{evResults.length > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                {values.length >= 2 ? <PerformanceChart results={athleteResults} event={event} accentColor={accentColor} competitions={competitions} /> : null}
                <View style={progStyles.sparkFooter}>
                  <Text style={progStyles.sparkFooterLabel}>Premier</Text>
                  <Text style={[progStyles.sparkFooterVal, { color: Colors.textMuted }]}>{firstResult?.result}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={progStyles.sparkFooterLabel}>Dernier</Text>
                  <Text style={[progStyles.sparkFooterVal, { color: accentColor }]}>{lastResult?.result}</Text>
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={progStyles.emptyBox}>
          <MaterialIcons name="insert-chart-outlined" size={32} color={Colors.textMuted} />
          <Text style={progStyles.emptyText}>Aucun résultat de compétition</Text>
          <Text style={progStyles.emptySubtext}>Demandez à votre coach de saisir vos performances</Text>
        </View>
      )}

      <View style={progStyles.sectionHeader}>
        <Text style={{ fontSize: 14 }}>🇨🇭</Text>
        <Text style={progStyles.sectionTitle}>Swiss Athletics</Text>
      </View>
      <Pressable style={progStyles.swissLink} onPress={() => openLink(getAthleteSearchUrl(athlete.name))}>
        <View style={{ flex: 1 }}>
          <Text style={progStyles.swissLinkTitle}>Résultats officiels</Text>
          <Text verbatim style={progStyles.swissLinkSub}>{t('search')} {athlete.name} · swiss-athletics.ch</Text>
        </View>
        <MaterialIcons name="open-in-new" size={16} color={accentColor} />
      </Pressable>
      <Pressable accessibilityRole="button" style={progStyles.swissLink} onPress={() => router.push({ pathname: '/import-results', params: { athleteId: athlete.id } })}>
        <View style={{ flex: 1 }}>
          <Text style={progStyles.swissLinkTitle}>Importer mes résultats</Text>
          <Text style={progStyles.swissLinkSub}>Copier-coller depuis Swiss Athletics : compétitions, résultats et PB</Text>
        </View>
        <MaterialIcons name="download" size={16} color={accentColor} />
      </Pressable>

      <Pressable style={progStyles.fullProfileBtn} onPress={() => router.push({ pathname: '/athlete-detail', params: { id: athlete.id } })}>
        <MaterialIcons name="bar-chart" size={18} color="#FFF" />
        <Text style={progStyles.fullProfileBtnText}>Voir la fiche complète & statistiques</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
      </Pressable>
    </View>
  );
}

const progStyles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiVal: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold },
  kpiLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  kpiDiv: { width: 1, backgroundColor: Colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm, paddingHorizontal: Spacing.screenPadding },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  pbCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  pbRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 10 },
  pbDot: { width: 8, height: 8, borderRadius: 4 },
  pbEvent: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  pbPerf: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold },
  pbBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#F59E0B20', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  pbBadgeText: { fontSize: 10, color: '#F59E0B', fontWeight: Typography.weightExtrabold },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  sparkCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  sparkHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sparkEvent: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sparkBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  sparkBadgeText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold },
  sparkFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sparkFooterLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  sparkFooterVal: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  swissLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  swissLinkTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  swissLinkSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  fullProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.info, borderRadius: Radius.lg, paddingVertical: 13, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  fullProfileBtnText: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF', textAlign: 'center' },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  emptyText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, fontWeight: Typography.weightSemibold },
  emptySubtext: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center' },
});

// ── Club role display names ────────────────────────────────────────────────
const CLUB_ROLE_LABELS: Record<string, string> = {
  president: 'Président(e)',
  vice_president: 'Vice-président(e)',
  secretary: 'Secrétaire général(e)',
  treasurer: 'Trésorier(ère)',
  technical_dir: 'Directeur/rice technique',
  admin: 'Administrateur/rice',
};

function getClubRoleLabel(role: string): string {
  return CLUB_ROLE_LABELS[role] || role;
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { showAlert } = useLocalizedAlert();
  const { user, athletes, results, competitions, trainingPlans, deleteAthlete } = useApp();
  const { t, language, setLanguage } = useI18n();
  const { roleLabel } = useCoachRoles();
  const { config: subConfig } = useSubscription();
  const { coaches, loading: coachesLoading } = useClubCoaches();
  const { screenPadding, maxContentWidth, isPhone } = useResponsive();
  const [langModal, setLangModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'progression'>('profil');
  const { openLink } = useExternalLinks();
  const sectionNav = useProfileSectionNavigation();
  const sectionParams = useLocalSearchParams<{ section?: string; focusId?: string }>();
  useFocusEffect(React.useCallback(() => {
    if (sectionParams.section === 'progression') setActiveTab('progression');
  }, [sectionParams.section, sectionParams.focusId]));

  const userType = user.userType || 'coach';
  const isAthlete = userType === 'athlete';
  const isClub = user.accountType === 'club';
  const roleColor = isClub ? '#10B981' : isAthlete ? Colors.info : Colors.primary;
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const groupBreakdown = EVENT_GROUPS.filter(g => g.id !== 'all').map(g => ({
    ...g, count: athletes.filter(a => a.group === g.id).length,
  })).filter(g => g.count > 0);
  const currentLang = LANGUAGES.find(l => l.code === language);
  const athleteRecord = isAthlete ? athletes.find(a => a.id === user.id || (a.email && a.email.toLowerCase() === user.email.toLowerCase())) ?? athletes.find(a => a.name === user.name) : null;

  const handleDeleteAthlete = (athleteId: string) => {
    showAlert(t('delete_athlete'), t('delete_athlete_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteAthlete(athleteId) },
    ]);
  };

  // Common settings rows (only relevant ones per role)
  const SettingsStrip = ({ showAnalytics = false }: { showAnalytics?: boolean }) => (
    <><SharedGroupsLink /><View style={styles.settingsStrip}>
      <Pressable style={({ pressed }) => [styles.settingBtn, pressed && { opacity: 0.75 }]} onPress={() => router.push('/edit-profile')}>
        <MaterialIcons name="edit" size={20} color={roleColor} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('edit_profile')}</Text>
          <Text verbatim style={styles.settingValue}>{user.name}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </Pressable>
      <View style={styles.settingDivider} />
      <Pressable style={({ pressed }) => [styles.settingBtn, pressed && { opacity: 0.75 }]} onPress={() => setLangModal(true)}>
        <Text style={styles.settingFlag}>{currentLang?.flag}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('language')}</Text>
          <Text style={styles.settingValue}>{currentLang?.nativeName}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </Pressable>
      <View style={styles.settingDivider} />
      <Pressable style={({ pressed }) => [styles.settingBtn, pressed && { opacity: 0.75 }]} onPress={() => router.push('/settings')}>
        <MaterialIcons name="settings" size={20} color={Colors.textSecondary} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings')}</Text>
          <Text style={styles.settingValue}>Notifications, biométrie, rôle</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </Pressable>
      {showAnalytics ? (
        <>
          <View style={styles.settingDivider} />
          <Pressable style={({ pressed }) => [styles.settingBtn, pressed && { opacity: 0.75 }]} onPress={() => router.push('/analytics')}>
            <MaterialIcons name="analytics" size={20} color="#7C3AED" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analyses avancées</Text>
              <Text style={styles.settingValue}>Graphiques, top performers, charge</Text>
            </View>
            <View style={styles.eliteTagInline}>
              <MaterialIcons name="workspace-premium" size={10} color="#7C3AED" />
              <Text style={styles.eliteTagText}>ELITE</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </>
      ) : null}
      {(user.isClubAdmin || user.accountType === 'club') ? (
        <>
          <View style={styles.settingDivider} />
          <Pressable style={({ pressed }) => [styles.settingBtn, pressed && { opacity: 0.75 }]} onPress={() => router.push('/club-admin')}>
            <MaterialIcons name="corporate-fare" size={20} color="#10B981" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Administration club</Text>
              <Text style={styles.settingValue}>Coachs invités, quotas, accès</Text>
            </View>
            <View style={[styles.eliteTagInline, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
              <MaterialIcons name="corporate-fare" size={10} color="#10B981" />
              <Text style={[styles.eliteTagText, { color: '#10B981' }]}>CLUB</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </>
      ) : null}
    </View></>
  );

  const LangModal = () => (
    <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setLangModal(false)}>
        <SwipeSheet onClose={() => setLangModal(false)} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('select_language')}</Text>
          {LANGUAGES.map(lang => (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [styles.langRow, language === lang.code && styles.langRowActive, pressed && { opacity: 0.75 }]}
              onPress={() => { setLanguage(lang.code as Language); setLangModal(false); }}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.langNative}>{lang.nativeName}</Text>
                
              </View>
              {language === lang.code
                ? <MaterialIcons name="check-circle" size={20} color={roleColor} />
                : <MaterialIcons name="radio-button-unchecked" size={20} color={Colors.border} />}
            </Pressable>
          ))}
        </SwipeSheet>
      </Pressable>
    </Modal>
  );

  // ─── CLUB / COMMITTEE VIEW ────────────────────────────────────────────────
  if (isClub) {
    const activePlans = trainingPlans.filter(p => {
      const today = new Date().toISOString().split('T')[0];
      return p.endDate >= today;
    });
    const upcomingComps = competitions.filter(c => c.status === 'upcoming');
    const completedComps = competitions.filter(c => c.status === 'completed');
    const totalAthletes = athletes.length;

    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView ref={sectionNav.scrollRef} onContentSizeChange={sectionNav.onContentSizeChange} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]}>
          <View style={styles.brandHeader}><AppBrand /></View>
          {/* Club profile card */}
          <View style={[styles.profileCard, Shadow.card, { padding: 0, overflow: 'hidden' }]}>
            {/* Green header for clubs (same layout as the coach card). */}
            <LinearGradient colors={['#0B8A5F', '#10B981', '#4ADE9F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileTop, { padding: Spacing.md, marginBottom: 0 }]}>
              <Pressable accessibilityLabel={t('edit_profile')} onPress={() => router.push('/edit-profile')} style={({ pressed }) => [pressed ? { opacity: 0.75 } : null]}>
                {user.avatar ? <Image source={{ uri: user.avatar }} contentFit="cover" transition={200} style={[styles.avatarImage, { borderColor: '#FFFFFF' }]} /> : <View style={[styles.avatarCircle, { backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.7)' }]}><MaterialIcons name="corporate-fare" size={28} color="#10B981" /></View>}
              </Pressable>
              <View style={styles.profileInfo}>
                <Text verbatim style={[styles.coachName, { color: '#FFFFFF' }]}>{user.club || 'Mon Club'}</Text>
                <View style={[styles.rolePill, { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                  <MaterialIcons name="admin-panel-settings" size={12} color="#10B981" />
                  <Text style={[styles.roleText, { color: '#10B981' }]}>{getClubRoleLabel(user.role)}</Text>
                </View>
                <Text verbatim style={[styles.clubText, { color: 'rgba(255,255,255,0.92)' }]}>{user.name}</Text>
                {user.email ? <Text verbatim style={[styles.emailText, { color: 'rgba(255,255,255,0.85)' }]}>{user.email}</Text> : null}
              </View>
            </LinearGradient>

            {/* Shared local club roster, including pending coaches. */}
            <View style={[styles.coachStats, { borderTopWidth: 0, padding: Spacing.md }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: '#10B981' }]}>{totalAthletes}</Text>
                <Text style={styles.statLbl}>Athlètes</Text>
              </View>
              <Pressable accessibilityLabel={`${coaches.length} coachs du club`} onPress={() => router.push('/club-admin')} style={({ pressed }) => [styles.statItem, pressed ? { opacity: 0.75 } : null]}>
                <Text style={[styles.statVal, { color: Colors.club }]}>{coachesLoading ? '…' : coaches.length}</Text>
                <Text style={styles.statLbl}>{t('coaches')}</Text>
              </Pressable>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: Colors.primary }]}>{activePlans.length}</Text>
                <Text style={styles.statLbl}>{t('nav_plans')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: Colors.warning }]}>{upcomingComps.length}</Text>
                <Text style={styles.statLbl}>À venir</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: Colors.success }]}>{completedComps.length}</Text>
                <Text style={styles.statLbl}>Terminées</Text>
              </View>
            </View>
          </View>

          <SubscriptionPlanCard />
          <SubscriptionUpgradeBanner />
          {/* Settings strip */}
          <SettingsStrip showAnalytics={true} />
          <CoachDirectorySection />
          <View onLayout={sectionNav.onAthletesLayout} style={styles.section}>
            <View style={styles.sectionTitleRow}><View style={[styles.sectionAccent, { backgroundColor: Colors.club }]} /><Text style={styles.sectionTitle}>{t('all_athletes')} ({athletes.length})</Text></View>
            <FlatList scrollEnabled={false} data={athletes} keyExtractor={athlete => athlete.id} renderItem={({ item: athlete }) => <Pressable accessibilityLabel={`Voir la fiche de ${athlete.name}`} onPress={() => router.push({ pathname: '/athlete-detail', params: { id: athlete.id } })} style={({ pressed }) => [styles.readOnlyCard, pressed ? { opacity: 0.7 } : null]}><MaterialIcons name="person-outline" size={24} color={Colors.club} /><View style={{ flex: 1 }}><Text verbatim style={styles.readOnlyTitle}>{athlete.name}</Text><Text style={styles.readOnlySub}>{athlete.events.join(' · ')}</Text></View><MaterialIcons name="chevron-right" size={22} color={Colors.club} /></Pressable>} ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyCardText}>Aucun athlète enregistré</Text></View>} />
          </View>

          {/* Plans section — read-only */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: Colors.primary }]} />
              <Text style={styles.sectionTitle}>Plans d'entraînement ({trainingPlans.length})</Text>
            </View>
            {trainingPlans.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="event-note" size={28} color={Colors.textMuted} />
                <Text style={styles.emptyCardText}>Aucun plan créé pour l'instant</Text>
              </View>
            ) : (
              trainingPlans.slice(0, 5).map(plan => (
                <View key={plan.id} style={styles.readOnlyCard}>
                  <View style={[styles.readOnlyDot, { backgroundColor: Colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text verbatim style={styles.readOnlyTitle}>{plan.title}</Text>
                    <Text style={styles.readOnlySub}>
                      {t(plan.phase)} · {plan.sessions.length} {t('sessions')}
                      {plan.startDate ? ` · ${t('start_date')} ${plan.startDate}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.readOnlyBadge, { backgroundColor: Colors.primary + '12' }]}>
                    <Text style={[styles.readOnlyBadgeText, { color: Colors.primary }]}>{plan.weeks}sem</Text>
                  </View>
                </View>
              ))
            )}
            {trainingPlans.length > 5 ? (
              <Text style={styles.moreText}>+{trainingPlans.length - 5} autres plans</Text>
            ) : null}
          </View>

          {/* Competitions section — read-only */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: Colors.warning }]} />
              <Text style={styles.sectionTitle}>Compétitions ({competitions.length})</Text>
            </View>
            {competitions.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="emoji-events" size={28} color={Colors.textMuted} />
                <Text style={styles.emptyCardText}>Aucune compétition enregistrée</Text>
              </View>
            ) : (
              competitions.slice(0, 5).map(comp => {
                const statusColors: Record<string, string> = { upcoming: Colors.primary, completed: Colors.success, cancelled: Colors.error };
                const statusLabels: Record<string, string> = { upcoming: 'À venir', completed: 'Terminée', cancelled: 'Annulée' };
                const sc = statusColors[comp.status] || Colors.textMuted;
                return (
                  <View key={comp.id} style={styles.readOnlyCard}>
                    <View style={[styles.readOnlyDot, { backgroundColor: sc }]} />
                    <View style={{ flex: 1 }}>
                      <Text verbatim style={styles.readOnlyTitle}>{comp.name}</Text>
                      <Text verbatim style={styles.readOnlySub}>{comp.date} · {comp.venue || t('Lieu non précisé')}</Text>
                    </View>
                    <View style={[styles.readOnlyBadge, { backgroundColor: sc + '12' }]}>
                      <Text style={[styles.readOnlyBadgeText, { color: sc }]}>{statusLabels[comp.status] || comp.status}</Text>
                    </View>
                  </View>
                );
              })
            )}
            {competitions.length > 5 ? (
              <Text style={styles.moreText}>+{competitions.length - 5} autres compétitions</Text>
            ) : null}
          </View>

          {/* Swiss Athletics */}
          <Pressable
            style={({ pressed }) => [styles.swissCard, pressed && { opacity: 0.85 }]}
            onPress={() => openLink('https://www.swiss-athletics.ch')}
          >
            <Text style={styles.swissFlag}>🇨🇭</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.swissTitle}>Swiss Athletics</Text>
              <Text style={styles.swissSub}>Portail officiel — licences, inscriptions, résultats</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color="#10B981" />
          </Pressable>

          <AppleticsLinks accentColor={Colors.club} />
        </ScrollView>
        <LangModal />
      </SafeAreaView>
    );
  }

  // ─── ATHLETE VIEW ─────────────────────────────────────────────────────────
  if (isAthlete) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]}>
          <View style={styles.brandHeader}><AppBrand /></View>
          <View style={[styles.profileCard, Shadow.card, { padding: 0, overflow: 'hidden' }]}>
            {/* Blue header for athletes (same layout as the coach card). */}
            <LinearGradient colors={['#1557B0', '#1A73E8', '#5E9EF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileTop, { padding: Spacing.md, marginBottom: 0 }]}>
              <Pressable onPress={() => router.push('/edit-profile')}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={[styles.avatarImage, { borderColor: '#FFFFFF' }]} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.7)' }]}>
                    <Text style={[styles.avatarInitials, { color: Colors.info }]}>{initials}</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.profileInfo}>
                <Text verbatim style={[styles.coachName, { color: '#FFFFFF' }]}>{user.name}</Text>
                <View style={[styles.rolePill, { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                  <MaterialIcons name="directions-run" size={12} color={Colors.info} />
                  <Text style={[styles.roleText, { color: Colors.info }]}>Athlète</Text>
                </View>
                {user.club ? <Text verbatim style={[styles.clubText, { color: 'rgba(255,255,255,0.92)' }]}>{user.club}</Text> : null}
                <View style={styles.athleteFreeBadge}>
                  <MaterialIcons name="check-circle" size={13} color="#FFFFFF" />
                  <Text style={[styles.athleteFreeText, { color: '#FFFFFF' }]}>Accès complet · fonctionnalités selon le plan coach</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <CoachDirectorySection />
          {/* Tabs: Profil / Progression */}
          <View style={styles.tabRow}>
            {(['profil', 'progression'] as const).map(tab => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && { backgroundColor: Colors.info, borderColor: Colors.info }]}
                onPress={() => setActiveTab(tab)}
              >
                <MaterialIcons name={tab === 'profil' ? 'person' : 'bar-chart'} size={14} color={activeTab === tab ? '#FFF' : Colors.textSecondary} />
                <Text style={[styles.tabLabel, activeTab === tab && { color: '#FFF' }]}>
                  {t(tab === 'profil' ? 'profile' : 'Progression')}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'profil' ? (
            <>
              {/* No analytics for athletes — depends on coach plan */}
              <SettingsStrip showAnalytics={false} />
              <Pressable
                style={({ pressed }) => [styles.swissCard, pressed && { opacity: 0.85 }]}
                onPress={() => openLink('https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/')}
              >
                <Text style={styles.swissFlag}>🇨🇭</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.swissTitle}>Inscriptions Swiss Athletics</Text>
                  <Text style={styles.swissSub}>Inscriptions en ligne — swiss-athletics.ch</Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={Colors.info} />
              </Pressable>
              <AppleticsLinks accentColor={Colors.info} />
            </>
          ) : (
            athleteRecord ? <AthleteProgressionView athleteId={athleteRecord.id} /> : (
              <View style={styles.noDataBox}>
                <MaterialIcons name="person-search" size={36} color={Colors.textMuted} />
                <Text style={styles.noDataText}>Profil athlète non lié à ce compte</Text>
                <Text style={styles.noDataSub}>Demandez à votre coach d'ajouter votre profil dans l'app</Text>
              </View>
            )
          )}
        </ScrollView>
        <LangModal />
      </SafeAreaView>
    );
  }

  // ─── COACH VIEW ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView ref={sectionNav.scrollRef} onContentSizeChange={sectionNav.onContentSizeChange} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]}>
        <View style={styles.brandHeader}><AppBrand /></View>
        <View style={[styles.profileCard, Shadow.card, { padding: 0, overflow: 'hidden' }]}>
          {/* Orange header like the sidebar and the logo. */}
          <LinearGradient colors={['#E2461A', '#FF5722', '#FF8A65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileTop, { padding: Spacing.md, marginBottom: 0 }]}>
            <Pressable onPress={() => router.push('/edit-profile')}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={[styles.avatarImage, { borderColor: '#FFFFFF' }]} contentFit="cover" />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.7)' }]}>
                  <Text style={[styles.avatarInitials, { color: Colors.primary }]}>{initials}</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.profileInfo}>
              <Text verbatim style={[styles.coachName, { color: '#FFFFFF' }]}>{user.name}</Text>
              <View style={styles.roleRow}>
                <View style={[styles.rolePill, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                  <MaterialIcons name="sports" size={12} color={Colors.primary} />
                  <Text style={[styles.roleText, { color: Colors.primary }]}>{roleLabel(user.role)}</Text>
                </View>
                <View style={[styles.subBadge, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                  <MaterialIcons name={subConfig.icon as any} size={11} color={subConfig.color} />
                  <Text style={[styles.subBadgeText, { color: subConfig.color }]}>{subConfig.badge}</Text>
                </View>
              </View>
              {user.club ? <Text verbatim style={[styles.clubText, { color: 'rgba(255,255,255,0.92)' }]}>{user.club}</Text> : null}
              {user.email ? <Text verbatim style={[styles.emailText, { color: 'rgba(255,255,255,0.85)' }]}>{user.email}</Text> : null}
            </View>
          </LinearGradient>
          <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}><AthleteStatusSummary /></View>
        </View>

        <SubscriptionPlanCard />
        <SubscriptionUpgradeBanner />

        {/* Coach gets analytics access */}
        <SettingsStrip showAnalytics={true} />

        <Pressable style={({ pressed }) => [styles.swissCard, pressed && { opacity: 0.85 }]} onPress={() => openLink('https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/')}>
          <Text style={styles.swissFlag}>🇨🇭</Text>
          <View style={{ flex: 1 }}><Text style={styles.swissTitle}>Inscriptions Swiss Athletics</Text><Text style={styles.swissSub}>Inscriptions en ligne pour vos athlètes</Text></View>
          <MaterialIcons name="open-in-new" size={18} color={Colors.primary} />
        </Pressable>

        <AppleticsLinks />

        {groupBreakdown.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: Colors.primary }]} />
              <Text style={styles.sectionTitle}>{t('squad_by_group')}</Text>
            </View>
            <View style={styles.groupGrid}>
              {groupBreakdown.map(g => (
                <View key={g.id} style={[styles.groupChip, { borderColor: g.color + '40', backgroundColor: g.color + '10' }]}>
                  <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                  <Text style={[styles.groupLabel, { color: g.color }]}>{t(g.labelKey)}</Text>
                  <Text style={[styles.groupCount, { color: g.color }]}>{g.count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View onLayout={sectionNav.onAthletesLayout} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: Colors.primary }]} />
              <Text style={styles.sectionTitle}>{t('all_athletes')} ({athletes.length})</Text>
            </View>
            <Pressable style={styles.addAthleteBtn} onPress={() => router.push('/athlete-add')}>
              <MaterialIcons name="person-add" size={14} color={Colors.primary} />
              <Text style={styles.addAthleteBtnText}>{t('add_athlete')}</Text>
            </Pressable>
          </View>
          <FlatList scrollEnabled={false} data={athletes} keyExtractor={athlete => athlete.id} renderItem={({ item: athlete }) => <SwipeableAthleteRow athlete={athlete} onPress={() => router.push({ pathname: '/athlete-detail', params: { id: athlete.id } })} onDelete={() => handleDeleteAthlete(athlete.id)} />} />
          <Pressable style={({ pressed }) => [styles.bigAddBtn, pressed && { opacity: 0.85 }]} onPress={() => router.push('/athlete-add')}>
            <MaterialIcons name="person-add" size={20} color="#FFF" />
            <Text style={styles.bigAddBtnText}>{t('add_athlete')}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <LangModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 120 },
  brandHeader: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md },
  profileCard: { marginVertical: Spacing.md, marginHorizontal: Spacing.screenPadding, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  profileTop: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.primary + '50' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightBold },
  profileInfo: { flex: 1, minWidth: 1, justifyContent: 'center', gap: 5 },
  coachName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  roleText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  subBadgeText: { fontSize: 10, fontWeight: Typography.weightExtrabold, letterSpacing: 0.3 },
  clubText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  emailText: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  coachStats: { flexDirection: 'row', gap: Spacing.xs, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  statItem: { flex: 1, minWidth: 1, minHeight: 48, alignItems: 'center' },
  statVal: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold },
  statLbl: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  athleteFreeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' },
  athleteFreeText: { fontSize: 10, color: Colors.success, fontWeight: Typography.weightSemibold },
  tabRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  tabLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  noDataBox: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: Spacing.screenPadding },
  noDataText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, textAlign: 'center' },
  noDataSub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.md },
  upgradeIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  upgradeInfo: { flex: 1 },
  upgradeTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold },
  upgradeSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  settingsStrip: { marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  settingDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  settingBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  settingFlag: { fontSize: 24 },
  settingInfo: { flex: 1, minWidth: 1 },
  settingLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.weightMedium },
  settingValue: { fontSize: Typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  swissCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  swissFlag: { fontSize: 24 },
  swissTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  swissSub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginTop: 2 },
  socialRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  socialBtnText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  addAthleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '12', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '35' },
  addAthleteBtnText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.weightBold },
  bigAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, marginTop: Spacing.sm },
  bigAddBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold },
  groupCount: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  eliteTagInline: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#7C3AED15', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#7C3AED30', marginRight: 4 },
  eliteTagText: { fontSize: 9, color: '#7C3AED', fontWeight: Typography.weightExtrabold },
  // Read-only club cards
  readOnlyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  readOnlyDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  readOnlyTitle: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  readOnlySub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  readOnlyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  readOnlyBadgeText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold },
  moreText: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center', marginTop: 4, fontStyle: 'italic' },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyCardText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: Spacing.sm, paddingHorizontal: Spacing.screenPadding, paddingBottom: 48 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1, borderColor: 'transparent' },
  langRowActive: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' },
  langFlag: { fontSize: 28 },
  langInfo: { flex: 1 },
  langNative: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  langEnglish: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },
});
