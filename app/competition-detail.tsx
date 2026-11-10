// Powered by OnSpace.AI
// v4 — invitations coach→athlète (oui/non), saisie manuelle résultats, aperçu PDF
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet, Linking,
  Modal, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components';
import { CompResult } from '@/types';
import { TRACK_EVENTS } from '@/constants/config';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { exportCompetitionResults } from '@/services/pdfExportService';
import { getCompetitionPresentation } from '@/services/competitionPresentationService';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { AvatarPhoto } from '@/components/ui/AvatarPhoto';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { SwipeSheet } from '@/components/ui/SwipeSheet';
import { isCompetitionOngoing } from '@/services/competitionStatusService';

const STATUS_COLORS: Record<string, string> = {
  upcoming: Colors.primary, completed: Colors.success, cancelled: Colors.error,
};
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const LIVE_RESULTS_URL = 'https://www.swiss-athletics.ch/fr/competitions/resultats/live-results/';

// ── Add/Edit Result Modal ─────────────────────────────────────────────────
function AddResultModal({ visible, onClose, onSave, athletes, events, editResult, forAthleteId }: {
  visible: boolean; onClose: () => void;
  onSave: (result: Omit<CompResult, 'id' | 'competitionId'>) => void;
  athletes: { id: string; name: string; events: string[]; avatar?: string }[];
  events: string[]; editResult?: CompResult | null; forAthleteId?: string;
}) {
  const [athleteId, setAthleteId] = useState(editResult?.athleteId || forAthleteId || athletes[0]?.id || '');
  const [event, setEvent] = useState(editResult?.event || events[0] || '');
  const [result, setResult] = useState(editResult?.result || '');
  const [rank, setRank] = useState(String(editResult?.rank ?? ''));
  const [isPb, setIsPb] = useState(editResult?.pb ?? false);
  const [notes, setNotes] = useState(editResult?.notes || '');
  const [showAthletes, setShowAthletes] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [customEvent, setCustomEvent] = useState('');
  const allEvents = [...new Set([...(event ? [event] : []), ...(editResult?.event ? [editResult.event] : []), ...events, ...TRACK_EVENTS])];
  const selectedAthlete = athletes.find(a => a.id === athleteId);

  const handleSave = () => {
    if (!athleteId || !event || !result.trim()) return;
    onSave({ athleteId, event, result: result.trim(), rank: parseInt(rank) || 0, pb: isPb, notes: notes.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SwipeSheet onClose={onClose} style={styles.modalSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editResult ? 'Modifier le résultat' : 'Ajouter un résultat'}</Text>
            <Pressable onPress={onClose} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.textSecondary} /></Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {!forAthleteId ? (
              <View style={styles.mField}>
                <Text style={styles.mLabel}>Athlète *</Text>
                <Pressable style={styles.mSelect} onPress={() => { setShowAthletes(v => !v); setShowEvents(false); }}>
                  <MaterialIcons name="person" size={16} color={Colors.primary} />
                  <Text style={styles.mSelectText}>{selectedAthlete?.name || 'Choisir...'}</Text>
                  <MaterialIcons name={showAthletes ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
                </Pressable>
                {showAthletes ? (
                  <View style={styles.dropdown}>
                    {athletes.map(a => (
                      <Pressable key={a.id} style={[styles.dropItem, athleteId === a.id && styles.dropItemActive]} onPress={() => { setAthleteId(a.id); setShowAthletes(false); }}>
                        <Text verbatim style={[styles.dropItemText, athleteId === a.id && { color: Colors.primary, fontWeight: Typography.weightBold }]}>{a.name}</Text>
                        {athleteId === a.id ? <MaterialIcons name="check" size={14} color={Colors.primary} /> : null}
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.mField}>
                <Text style={styles.mLabel}>Athlète</Text>
                <View style={[styles.mSelect, { backgroundColor: Colors.surface }]}>
                  <MaterialIcons name="person" size={16} color={Colors.primary} />
                  <Text style={styles.mSelectText}>{selectedAthlete?.name || '-'}</Text>
                </View>
              </View>
            )}
            <View style={styles.mField}>
              <Text style={styles.mLabel}>Épreuve *</Text>
              <Pressable style={styles.mSelect} onPress={() => { setShowEvents(v => !v); setShowAthletes(false); }}>
                <MaterialIcons name="flag" size={16} color={Colors.primary} />
                <Text style={styles.mSelectText}>{event || 'Choisir...'}</Text>
                <MaterialIcons name={showEvents ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
              </Pressable>
              {showEvents ? (
                <View style={[styles.dropdown, { maxHeight: 200 }]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {allEvents.map(e => (
                      <Pressable key={e} style={[styles.dropItem, event === e && styles.dropItemActive]} onPress={() => { setEvent(e); setShowEvents(false); }}>
                        <Text style={[styles.dropItemText, event === e && { color: Colors.primary, fontWeight: Typography.weightBold }]}>{e}</Text>
                        {event === e ? <MaterialIcons name="check" size={14} color={Colors.primary} /> : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                    <TextInput accessibilityLabel="Autre discipline" style={[styles.mInput, { flex: 1 }]} value={customEvent} onChangeText={setCustomEvent} placeholder="Autre discipline" placeholderTextColor={Colors.textMuted}
                      onSubmitEditing={() => { if (customEvent.trim()) { setEvent(customEvent.trim()); setCustomEvent(''); setShowEvents(false); } }} returnKeyType="done" />
                    <Pressable accessibilityRole="button" accessibilityLabel="Utiliser cette discipline" disabled={!customEvent.trim()} onPress={() => { setEvent(customEvent.trim()); setCustomEvent(''); setShowEvents(false); }}
                      style={({ pressed }) => [{ width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, opacity: !customEvent.trim() ? 0.4 : pressed ? 0.8 : 1 }]}>
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.mField}>
              <Text style={styles.mLabel}>Performance * <Text style={styles.mHint}>(ex. 10.85, 7.32m, 1h02:14)</Text></Text>
              <TextInput accessibilityLabel="Performance" style={styles.mInput} value={result} onChangeText={setResult} placeholder="ex. 10.85" placeholderTextColor={Colors.textMuted} autoCorrect={false} />
            </View>
            <View style={styles.mField}>
              <Text style={styles.mLabel}>Classement <Text style={styles.mHint}>(place)</Text></Text>
              <TextInput accessibilityLabel="Classement" style={styles.mInput} value={rank} onChangeText={setRank} keyboardType="number-pad" placeholder="ex. 1" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={[styles.mField, styles.pbRow]}>
              <View style={{ flex: 1 }}><Text style={styles.mLabel}>Record personnel (PB)</Text><Text style={styles.mHint}>Cocher si nouveau record</Text></View>
              <Switch value={isPb} onValueChange={setIsPb} trackColor={{ false: Colors.border, true: Colors.success + '80' }} thumbColor={isPb ? Colors.success : Colors.textMuted} />
            </View>
            <View style={styles.mField}>
              <Text style={styles.mLabel}>Notes <Text style={styles.mHint}>(optionnel)</Text></Text>
              <TextInput accessibilityLabel="Notes du résultat" style={[styles.mInput, styles.mTextarea]} value={notes} onChangeText={setNotes} placeholder="ex. Vent favorable..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />
            </View>
          </ScrollView>
          <Pressable style={[styles.saveResultBtn, (!athleteId || !event || !result.trim()) && { opacity: 0.4 }]} onPress={handleSave} disabled={!athleteId || !event || !result.trim()}>
            <MaterialIcons name="check" size={18} color="#FFF" />
            <Text style={styles.saveResultBtnText}>{editResult ? 'Enregistrer' : 'Ajouter'}</Text>
          </Pressable>
        </SwipeSheet>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Invitation Modal (coach invites athletes) ─────────────────────────────
function InviteModal({ visible, onClose, allAthletes, invitedIds, onToggle }: {
  visible: boolean; onClose: () => void;
  allAthletes: { id: string; name: string; events: string[]; avatar?: string }[];
  invitedIds: string[];
  onToggle: (athleteId: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <SwipeSheet onClose={onClose} style={[styles.modalSheet, { maxHeight: '70%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inviter des athlètes</Text>
            <Pressable onPress={onClose} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.textSecondary} /></Pressable>
          </View>
          <Text style={styles.inviteSubtitle}>Les athlètes invités verront la compétition et pourront confirmer leur présence</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {allAthletes.map(a => {
              const isInvited = invitedIds.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  style={[styles.inviteRow, isInvited && styles.inviteRowActive]}
                  onPress={() => onToggle(a.id)}
                >
                  <View style={[styles.inviteAvatar, isInvited && { backgroundColor: Colors.primary + '20', borderColor: Colors.primary + '40' }]}>
                    <Text style={[styles.inviteAvatarText, isInvited && { color: Colors.primary }]}>
                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                    <AvatarPhoto uri={a.avatar} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text verbatim style={styles.inviteName}>{a.name}</Text>
                    <Text style={styles.inviteEvents}>{a.events.slice(0, 2).join(' · ')}</Text>
                  </View>
                  <View style={[styles.inviteCheck, isInvited && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                    {isInvited ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={styles.inviteDoneBtn} onPress={onClose}>
            <Text style={styles.inviteDoneBtnText}>Confirmer ({invitedIds.length} athlète{invitedIds.length !== 1 ? 's' : ''})</Text>
          </Pressable>
        </SwipeSheet>
      </Pressable>
    </Modal>
  );
}

// ── PDF Preview Modal ─────────────────────────────────────────────────────
function PdfPreviewModal({ visible, onClose, onExport, competition, results, athletes }: {
  visible: boolean; onClose: () => void; onExport: () => void;
  competition: any; results: CompResult[]; athletes: any[];
}) {
  const { locale } = useI18n();
  const compResults = results.filter(r => r.competitionId === competition.id);
  const eventGroups = [...new Set(compResults.map(r => r.event))];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SwipeSheet onClose={onClose} style={[styles.modalSheet, { maxHeight: '85%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="picture-as-pdf" size={20} color={Colors.error} />
              <Text style={styles.modalTitle}>Aperçu PDF</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.textSecondary} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* PDF preview content */}
            <View style={styles.pdfPreview}>
              <View style={styles.pdfHeader}>
                <View style={styles.pdfLogo}><Text style={styles.pdfLogoText}>AP</Text></View>
                <View>
                  <Text verbatim style={styles.pdfTitle}>{competition.name}</Text>
                  <Text style={styles.pdfMeta}>{competition.date} · {competition.venue}</Text>
                </View>
              </View>
              <View style={styles.pdfDivider} />
              {compResults.length === 0 ? (
                <Text style={styles.pdfEmpty}>Aucun résultat enregistré</Text>
              ) : eventGroups.map(evt => (
                <View key={evt} style={styles.pdfEventBlock}>
                  <Text style={styles.pdfEventTitle}>{evt}</Text>
                  {compResults.filter(r => r.event === evt).sort((a, b) => (a.rank || 99) - (b.rank || 99)).map(r => {
                    const athlete = athletes.find(a => a.id === r.athleteId);
                    return (
                      <View key={r.id} style={styles.pdfResultRow}>
                        <Text style={styles.pdfRank}>#{r.rank || '-'}</Text>
                        <Text verbatim style={styles.pdfAthleteName}>{athlete?.name || '-'}</Text>
                        <Text style={[styles.pdfResult, r.pb && { color: Colors.success }]}>{r.result}{r.pb ? ' PB' : ''}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
              <Text style={styles.pdfFooter}>Appletics · exporté le {new Date().toLocaleDateString(locale)}</Text>
            </View>
          </ScrollView>
          <View style={styles.pdfActions}>
            <Pressable style={styles.pdfCancelBtn} onPress={onClose}>
              <Text style={styles.pdfCancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.pdfExportBtn} onPress={onExport}>
              <MaterialIcons name="download" size={16} color="#FFF" />
              <Text style={styles.pdfExportBtnText}>Exporter & Partager</Text>
            </Pressable>
          </View>
        </SwipeSheet>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function CompetitionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { competitions, results, athletes, user, addResult, updateResult, updateCompetition } = useApp();
  const { openLink } = useExternalLinks();
  const { t, language, locale } = useI18n();
  const { showAlert } = useAlert();
  const { hasFeature } = useSubscription();
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'athletes'>('overview');
  const [showAddResult, setShowAddResult] = useState(false);
  const [editingResult, setEditingResult] = useState<CompResult | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const competition = competitions.find(c => c.id === id);
  const sharedGroups = useSharedGroups();
  if (!competition) return null;

  const isAthlete = user.userType === 'athlete';
  const compResults = results.filter(r => r.competitionId === id);
  const ongoing = isCompetitionOngoing(competition);
  const statusColor = ongoing ? Colors.success : STATUS_COLORS[competition.status] || Colors.primary;
  const compAthletes = athletes.filter(a => competition.athleteIds.includes(a.id));
  // Athlete view: the other athletes the coach registered (names sent by the coach).
  const teammates = user.userType === 'athlete' ? (competition.teammates ?? []).filter(item => !compAthletes.some(a => a.name === item.name)) : [];

  // User's athlete record (for athlete self-entry)
  const athleteForUser = isAthlete ? athletes.find(a => a.id === user.id || (a.email && a.email.toLowerCase() === user.email.toLowerCase())) ?? athletes.find(a => a.name === user.name) : undefined;

  // Athlete invitation status (simulate with athleteIds)
  const handleToggleInvite = (athleteId: string) => {
    const newIds = competition.athleteIds.includes(athleteId)
      ? competition.athleteIds.filter(id => id !== athleteId)
      : [...competition.athleteIds, athleteId];
    updateCompetition({ ...competition, athleteIds: newIds });
  };

  const handleAddResult = (data: Omit<CompResult, 'id' | 'competitionId'>) => {
    if (editingResult) {
      const current = results.find(result => result.id === editingResult.id);
      if (!current) { showAlert('Résultat introuvable', 'Ce résultat ne peut plus être modifié.'); return; }
      updateResult({ ...current, ...data });
    } else {
      addResult({ id: `res-${Date.now()}`, competitionId: competition.id, ...data });
    }
    setActiveTab('results');
  };

  const handleExportPDF = async () => {
    setShowPdfPreview(false);
    if (!hasFeature('pdf_export')) {
      router.push({ pathname: '/upgrade', params: { tier: 'elite', reason: 'Export PDF requiert le plan Elite' } } as any);
      return;
    }
    setExporting(true);
    try { await exportCompetitionResults(competition, results, athletes, language); }
    catch { showAlert('Erreur', 'Impossible de générer le PDF.'); }
    finally { setExporting(false); }
  };

  const sortedResults = [...compResults].sort((a, b) => {
    if (a.event !== b.event) return a.event.localeCompare(b.event);
    return (a.rank || 99) - (b.rank || 99);
  });

  const tabLabels = {
    overview: 'Aperçu',
    results: `Résultats${compResults.length > 0 ? ` (${compResults.length})` : ''}`,
    athletes: `Athlètes (${compAthletes.length + teammates.length})`,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => openLink(LIVE_RESULTS_URL)} style={styles.liveBtn} hitSlop={4}>
            <MaterialIcons name="live-tv" size={16} color="#FF5722" />
            <Text style={styles.liveBtnText}>Live</Text>
          </Pressable>
          {/* PDF preview button */}
          {!isAthlete && !user.isClubAdmin ? (
            <Pressable onPress={() => setShowPdfPreview(true)} style={[styles.editBtn, { backgroundColor: Colors.error + '15', borderColor: Colors.error + '40' }]} hitSlop={4}>
              <MaterialIcons name="picture-as-pdf" size={18} color={Colors.error} />
            </Pressable>
          ) : null}
          {!isAthlete && !user.isClubAdmin ? (
            <Pressable onPress={() => router.push({ pathname: '/competition-create', params: { id: competition.id } })} style={styles.editBtn} hitSlop={4}>
              <MaterialIcons name="edit" size={18} color={Colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Meet header */}
        <View style={[styles.meetCard, { borderColor: statusColor + '40' }]}>
          <View style={[styles.dateBox, { backgroundColor: statusColor + '12' }]}>
            <Text style={[styles.dateNum, { color: statusColor }]}>{new Date(competition.date + 'T00:00:00').getDate()}</Text>
            <Text style={[styles.dateMonth, { color: statusColor }]}>{new Date(competition.date + 'T00:00:00').toLocaleString(locale, { month: 'short' }).toUpperCase()}</Text>
          </View>
          <View style={styles.meetInfo}>
            <View style={styles.meetBadges}>
              <Badge label={getCompetitionPresentation(competition, language).typeLabel} size="sm" />
              <Badge label={ongoing ? 'En cours' : t(competition.status)} color={statusColor} size="sm" />
            </View>
            <Text verbatim style={styles.meetName}>{competition.name}</Text>
            <Pressable style={styles.venueRow} onPress={() => openLink(`https://maps.google.com/?q=${encodeURIComponent(competition.venue)}`)}>
              <MaterialIcons name="place" size={14} color="#1A73E8" />
              <Text verbatim style={styles.meetVenue}>{competition.venue}</Text>
              <MaterialIcons name="open-in-new" size={12} color="#1A73E8" />
            </Pressable>
          </View>
        </View>

        {/* Score card */}
        {competition.teamScore !== undefined ? (
          <View style={[styles.scoreCard, Shadow.card]}>
            <View style={styles.scoreItem}><MaterialIcons name="emoji-events" size={24} color={Colors.primary} /><Text style={styles.scoreVal}>{competition.teamScore}</Text><Text style={styles.scoreLbl}>{t('team_score')}</Text></View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}><MaterialIcons name="leaderboard" size={24} color={Colors.success} /><Text verbatim style={[styles.scoreVal, { color: Colors.success }]}>{(() => { const best = competition.teamRank || Math.min(...compResults.map(r => r.rank || Infinity)); return Number.isFinite(best) && best > 0 ? (best === 1 ? '1er' : `${best}e`) : '—'; })()}</Text><Text style={styles.scoreLbl}>{competition.teamRank ? t('team_rank') : 'Meilleure place'}</Text></View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}><MaterialIcons name="star" size={24} color={Colors.warning} /><Text style={styles.scoreVal}>{compResults.filter(r => r.pb).length}</Text><Text style={styles.scoreLbl}>{t('pbs_set')}</Text></View>
          </View>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['overview', 'results', 'athletes'] as const).map(tab => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tabLabels[tab]}</Text>
            </Pressable>
          ))}
        </View>

        {/* Overview */}
        {activeTab === 'overview' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Épreuves au programme</Text>
            <View style={styles.eventsGrid}>
              {competition.events.map(event => (
                <View key={event} style={styles.eventChip}><Text style={styles.eventChipText}>{event}</Text></View>
              ))}
            </View>
            <Pressable style={styles.swissLink} onPress={() => openLink('https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/')}>
              <Text style={{ fontSize: 18 }}>🇨🇭</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.swissLinkTitle}>Inscriptions Swiss Athletics</Text>
                <Text style={styles.swissLinkSub}>S'inscrire en ligne pour cette compétition</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
            </Pressable>

            {/* Athlete confirmations */}
            {compAthletes.length > 0 ? (
              <View style={styles.confirmationPanel}>
                <View style={styles.confirmationHeader}>
                  <MaterialIcons name="how-to-reg" size={16} color={Colors.success} />
                  <Text style={styles.confirmationTitle}>Présences confirmées</Text>
                  <Text style={[styles.confirmationCount, { color: Colors.success }]}>{compAthletes.length}</Text>
                </View>
                <View style={styles.confirmAvatarRow}>
                  {compAthletes.slice(0, 6).map((a, i) => (
                    <View key={a.id} style={[styles.confirmAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
                      <Text style={styles.confirmAvatarText}>{a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                      <AvatarPhoto uri={a.avatar} />
                    </View>
                  ))}
                  {compAthletes.length > 6 ? (
                    <View style={[styles.confirmAvatar, { marginLeft: -10, backgroundColor: Colors.surfaceElevated }]}>
                      <Text style={[styles.confirmAvatarText, { color: Colors.textMuted }]}>+{compAthletes.length - 6}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Results */}
        {activeTab === 'results' ? (
          <View style={styles.section}>
            {!user.isClubAdmin ? (
              <Pressable style={({ pressed }) => [styles.addResultBtn, pressed ? { opacity: 0.8 } : null]} onPress={() => {
                if (isAthlete && !athleteForUser) { showAlert('Profil non lié', 'Demandez à votre coach de lier votre fiche athlète.'); return; }
                setEditingResult(null); setShowAddResult(true);
              }}>
                <MaterialIcons name="add" size={18} color={Colors.textOnPrimary} />
                <Text style={styles.addResultBtnText}>{isAthlete ? 'Ajouter mon résultat' : 'Ajouter un résultat'}</Text>
              </Pressable>
            ) : null}

            {sortedResults.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="bar-chart" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptyText}>{isAthlete ? "Appuie sur \"Ajouter mon résultat\" pour saisir ta performance." : "Cliquez sur \"Ajouter un résultat\" pour saisir les performances."}</Text>
              </View>
            ) : (
              [...new Set(sortedResults.map(r => r.event))].map(evt => (
                <View key={evt} style={{ marginBottom: Spacing.lg }}>
                  <View style={styles.eventResultHeader}>
                    <MaterialIcons name="flag" size={14} color={Colors.primary} />
                    <Text style={styles.eventResultTitle}>{evt}</Text>
                  </View>
                  {sortedResults.filter(r => r.event === evt).map(r => {
                    const athlete = athletes.find(a => a.id === r.athleteId);
                    const rankColor = r.rank >= 1 && r.rank <= 3 ? RANK_COLORS[r.rank - 1] : Colors.textMuted;
                    return (
                      <Pressable key={r.id} accessibilityLabel={`Modifier ${athlete?.name ?? 'athlète'}, ${r.event}, ${r.result}`} disabled={user.isClubAdmin || (isAthlete && r.athleteId !== athleteForUser?.id)} style={({ pressed }) => [styles.resultRow, pressed ? { opacity: 0.8 } : null]} onPress={() => { setEditingResult(r); setShowAddResult(true); }}>
                        <View style={[styles.rankBadge, { backgroundColor: rankColor + '20', borderColor: rankColor + '50' }]}>
                          {r.rank > 0 ? <Text style={[styles.rankNum, { color: rankColor }]}>#{r.rank}</Text> : <MaterialIcons name="remove" size={14} color={Colors.textMuted} />}
                        </View>
                        <View style={styles.resultInfo}>
                          <Text verbatim style={styles.resultAthlete}>{athlete?.name || t('Inconnu')}</Text>
                          {r.notes ? <Text verbatim style={styles.resultNotes}>{r.notes}</Text> : null}
                        </View>
                        <View style={styles.resultRight}>
                          <Text style={styles.resultValue}>{r.result}</Text>
                          {r.pb ? <View style={styles.pbBadge}><Text style={styles.pbText}>PB</Text></View> : null}
                        </View>
                        <MaterialIcons name="chevron-right" size={16} color={Colors.textMuted} />
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Athletes */}
        {activeTab === 'athletes' ? (
          <View style={styles.section}>
            {/* Invite button for coaches */}
            {!isAthlete && !user.isClubAdmin ? (
              <Pressable style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
                <MaterialIcons name="person-add" size={18} color={Colors.primary} />
                <Text style={styles.inviteBtnText}>Inviter des athlètes</Text>
              </Pressable>
            ) : null}

            {teammates.map(item => (
              <View key={`mate-${item.id}`} style={styles.athleteRow}>
                <View style={styles.athleteAvatar}><Text verbatim style={styles.athleteAvatarText}>{item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text><AvatarPhoto uri={(() => { const record = sharedGroups.data.athletes.find(entry => entry.id === item.id); return record?.user_id ? sharedGroups.data.members.find(member => member.user_id === record.user_id && member.avatar)?.avatar : null; })()} /></View>
                <View style={styles.athleteInfo}><Text verbatim style={styles.athleteName}>{item.name}</Text><Text style={styles.athleteEvents}>Même groupe</Text></View>
                <View style={styles.confirmedBadge}><MaterialIcons name="check-circle" size={11} color={Colors.success} /><Text style={styles.confirmedText}>Inscrit</Text></View>
              </View>
            ))}
            {compAthletes.length === 0 && teammates.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="group" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Aucun athlète</Text>
                <Text style={styles.emptyText}>Invitez des athlètes avec le bouton ci-dessus, ou modifiez la compétition.</Text>
              </View>
            ) : (
              compAthletes.map(a => {
                const athleteResults = compResults.filter(r => r.athleteId === a.id);
                return (
                  <Pressable key={a.id} style={styles.athleteRow} onPress={() => router.push({ pathname: '/athlete-detail', params: { id: a.id } })}>
                    <View style={styles.athleteAvatar}>
                      <Text style={styles.athleteAvatarText}>{a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                      <AvatarPhoto uri={a.avatar} />
                    </View>
                    <View style={styles.athleteInfo}>
                      <Text verbatim style={styles.athleteName}>{a.name}</Text>
                      <Text style={styles.athleteEvents}>{a.events.filter(e => competition.events.includes(e)).join(' · ') || a.events.slice(0, 2).join(' · ')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {/* Status badge: confirmed */}
                      <View style={styles.confirmedBadge}>
                        <MaterialIcons name="check-circle" size={11} color={Colors.success} />
                        <Text style={styles.confirmedText}>Confirmé</Text>
                      </View>
                      {athleteResults.length > 0 ? (
                        <View style={styles.resCountBadge}><Text style={styles.resCountText}>{athleteResults.length} résultat{athleteResults.length > 1 ? 's' : ''}</Text></View>
                      ) : null}
                      {athleteResults.some(r => r.pb) ? <View style={styles.pbBadge}><Text style={styles.pbText}>PB</Text></View> : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Modals */}
      {showAddResult ? <AddResultModal
        key={editingResult?.id ?? 'new-result'}
        visible={true}
        onClose={() => { setShowAddResult(false); setEditingResult(null); }}
        onSave={handleAddResult}
        athletes={isAthlete && athleteForUser ? [athleteForUser] : athletes}
        events={competition.events}
        editResult={editingResult ? results.find(result => result.id === editingResult.id) ?? editingResult : null}
        forAthleteId={isAthlete && athleteForUser ? athleteForUser.id : undefined}
      /> : null}
      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        allAthletes={athletes}
        invitedIds={competition.athleteIds}
        onToggle={handleToggleInvite}
      />
      <PdfPreviewModal
        visible={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        onExport={handleExportPDF}
        competition={competition}
        results={results}
        athletes={athletes}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md },
  backBtn: { padding: 8, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md },
  liveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.md, backgroundColor: '#FF5722' + '15', borderWidth: 1, borderColor: '#FF5722' + '40' },
  liveBtnText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: '#FF5722' },
  editBtn: { padding: 8, backgroundColor: Colors.primary + '15', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '40' },
  scroll: { paddingBottom: 120 },
  meetCard: { margin: Spacing.screenPadding, marginTop: 0, backgroundColor: Colors.surfaceCard, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, flexDirection: 'row', gap: Spacing.md },
  dateBox: { width: 60, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, paddingVertical: 10 },
  dateNum: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.weightExtrabold, lineHeight: 30 },
  dateMonth: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, letterSpacing: 1 },
  meetInfo: { flex: 1 },
  meetBadges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  meetName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, marginBottom: 6 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meetVenue: { fontSize: Typography.fontSizeSM, color: '#1A73E8', flex: 1, textDecorationLine: 'underline' },
  scoreCard: { flexDirection: 'row', marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  scoreItem: { flex: 1, alignItems: 'center', gap: 4 },
  scoreDivider: { width: 1, backgroundColor: Colors.border },
  scoreVal: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.weightExtrabold, color: Colors.primary },
  scoreLbl: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, textAlign: 'center' },
  tabLabelActive: { color: '#FFF' },
  section: { paddingHorizontal: Spacing.screenPadding },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  eventChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  eventChipText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  swissLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  swissLinkTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  swissLinkSub: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  // Confirmation panel
  confirmationPanel: { backgroundColor: Colors.success + '08', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '30', marginBottom: Spacing.md },
  confirmationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  confirmationTitle: { flex: 1, fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.success },
  confirmationCount: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightExtrabold },
  confirmAvatarRow: { flexDirection: 'row', alignItems: 'center' },
  confirmAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary + '20', borderWidth: 1.5, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  confirmAvatarText: { fontSize: 10, fontWeight: Typography.weightBold, color: Colors.primary },
  // Results
  addResultBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 13, marginBottom: Spacing.lg },
  addResultBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
  eventResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6 },
  eventResultTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.primary },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  rankBadge: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rankNum: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightExtrabold },
  resultInfo: { flex: 1 },
  resultAthlete: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  resultNotes: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  resultRight: { alignItems: 'flex-end', gap: 4 },
  resultValue: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  pbBadge: { backgroundColor: Colors.success + '25', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.success + '60' },
  pbText: { fontSize: Typography.fontSizeXS, color: Colors.success, fontWeight: Typography.weightExtrabold },
  emptyState: { alignItems: 'center', paddingTop: 32, gap: 8, paddingBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  emptyText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  // Athletes tab
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary + '12', borderRadius: Radius.lg, paddingVertical: 12, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '35' },
  inviteBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.primary },
  athleteRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  athleteAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary + '40', alignItems: 'center', justifyContent: 'center' },
  athleteAvatarText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.primary },
  athleteInfo: { flex: 1 },
  athleteName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  athleteEvents: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.success + '12', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  confirmedText: { fontSize: 10, color: Colors.success, fontWeight: Typography.weightBold },
  resCountBadge: { backgroundColor: Colors.primary + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  resCountText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.weightSemibold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.sm, paddingBottom: 40, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  modalScroll: { paddingBottom: 20 },
  mField: { marginBottom: Spacing.md },
  mLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 6 },
  mHint: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.weightMedium },
  mInput: { backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Typography.fontSizeBase, color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.border },
  mTextarea: { height: 80, textAlignVertical: 'top' },
  mSelect: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1.5, borderColor: Colors.border },
  mSelectText: { flex: 1, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  dropdown: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: 4, overflow: 'hidden' },
  dropItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropItemActive: { backgroundColor: Colors.primary + '08' },
  dropItemText: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary },
  pbRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  saveResultBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, marginTop: Spacing.md },
  saveResultBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
  // Invite modal
  inviteSubtitle: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 20 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, gap: Spacing.md, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  inviteRowActive: { backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '30' },
  inviteAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  inviteAvatarText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: Colors.textMuted },
  inviteName: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  inviteEvents: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  inviteCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  inviteDoneBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.md },
  inviteDoneBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
  // PDF Preview
  pdfPreview: { backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  pdfLogo: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  pdfLogoText: { color: '#FFF', fontWeight: Typography.weightExtrabold, fontSize: Typography.fontSizeMD, letterSpacing: 1 },
  pdfTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightExtrabold, color: '#0F172A' },
  pdfMeta: { fontSize: Typography.fontSizeXS, color: '#94A3B8', marginTop: 2 },
  pdfDivider: { height: 2, backgroundColor: '#FF572230', marginBottom: Spacing.md },
  pdfEmpty: { fontSize: Typography.fontSizeSM, color: '#94A3B8', textAlign: 'center', paddingVertical: Spacing.lg, fontStyle: 'italic' },
  pdfEventBlock: { marginBottom: Spacing.md },
  pdfEventTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.primary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pdfResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EAEDF2', gap: 8 },
  pdfRank: { width: 32, fontSize: Typography.fontSizeXS, fontWeight: Typography.weightBold, color: '#475569' },
  pdfAthleteName: { flex: 1, fontSize: Typography.fontSizeSM, color: '#0F172A', fontWeight: Typography.weightMedium },
  pdfResult: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: '#0F172A' },
  pdfFooter: { fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: '#EAEDF2', paddingTop: Spacing.sm },
  pdfActions: { flexDirection: 'row', gap: Spacing.sm },
  pdfCancelBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  pdfCancelBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textSecondary },
  pdfExportBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error, borderRadius: Radius.lg, paddingVertical: 13 },
  pdfExportBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: '#FFF' },
});
