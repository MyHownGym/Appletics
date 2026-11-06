// Powered by OnSpace.AI
// Add Athlete screen — manual form + email/SMS invite
import React, { useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet,
  Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAthleteForm } from '@/hooks/useAthleteForm';
import { useI18n } from '@/hooks/useI18n';
import { EVENT_GROUPS } from '@/constants/config';
import { useInvitation } from '@/hooks/useInvitation';

const STATUS_OPTIONS = [
  { id: 'active', icon: 'check-circle', color: Colors.success },
  { id: 'injured', icon: 'healing', color: Colors.error },
  { id: 'inactive', icon: 'pause-circle-outline', color: Colors.textMuted },
] as const;

export default function AthleteAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const form = useAthleteForm(editId);
  const invitation = useInvitation();
  const { existing, canEdit, name, setName, eventsText, setEventsText, group, setGroup, status, setStatus,
    pbs, setPbs, pbEvent, setPbEvent, pbPerf, setPbPerf, handleAddPb, email, setEmail,
    phone, setPhone, birthYear, setBirthYear, club, setClub, licenseNumber, setLicenseNumber,
    avatar, setAvatar, notes, setNotes } = form;
  const { t } = useI18n();

  // Tab
  const [tab, setTab] = useState<'manual' | 'invite'>('manual');

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');

  const groups = EVENT_GROUPS.filter(g => g.id !== 'all');

  const groupLabel = (id: string) => {
    const labels: Record<string, string> = {
      sprints: t('sprints'), distance: t('distance'), hurdles: t('hurdles'),
      jumps: t('jumps'), throws: t('throws'), relay: t('relay'), field: t('field'),
    };
    return labels[id] || id;
  };

  const handleSave = () => { if (form.save()) router.back(); };

  const handleInviteEmail = () => invitation.sendEmail(inviteEmail, { name: inviteName, role: 'athlete' });
  const handleInviteSMS = () => invitation.sendSms(invitePhone, { name: inviteName, role: 'athlete' });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? 'Modifier l’athlète' : t('add_athlete')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      {!editId ? <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="tab" accessibilityState={{ selected: tab === 'manual' }}
          style={({ pressed }) => [styles.tab, tab === 'manual' ? styles.tabActive : null, pressed ? styles.pressed : null]}
          onPress={() => setTab('manual')}
        >
          <MaterialIcons name="person-add" size={16} color={tab === 'manual' ? Colors.textOnPrimary : Colors.textSecondary} />
          <Text style={[styles.tabLabel, tab === 'manual' && styles.tabLabelActive]}>{t('manual_entry')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab" accessibilityState={{ selected: tab === 'invite' }}
          style={({ pressed }) => [styles.tab, tab === 'invite' ? styles.tabActive : null, pressed ? styles.pressed : null]}
          onPress={() => setTab('invite')}
        >
          <MaterialIcons name="send" size={16} color={tab === 'invite' ? Colors.textOnPrimary : Colors.textSecondary} />
          <Text style={[styles.tabLabel, tab === 'invite' && styles.tabLabelActive]}>{t('invite')}</Text>
        </Pressable>
      </View> : null}

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: 960, alignSelf: 'center' }]}>
        {!canEdit ? <Text style={styles.hint}>Cette fiche est en lecture seule.</Text> : null}
        <Text style={styles.storageHint}>Athlètes, résultats et PBs enregistrés sur cet appareil.</Text>
        {tab === 'manual' ? (
          <>
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('athlete_name')} *</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel={t('athlete_name')}
                value={name}
                onChangeText={setName}
                placeholder={t('enter_name')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}><Text style={styles.fieldLabel}>E-mail</Text><TextInput accessibilityLabel="E-mail de l’athlète" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="athlete@email.com" placeholderTextColor={Colors.textMuted} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>Téléphone</Text><TextInput accessibilityLabel="Téléphone de l’athlète" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+41 79 000 00 00" placeholderTextColor={Colors.textMuted} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>Année de naissance</Text><TextInput accessibilityLabel="Année de naissance" style={styles.input} value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" maxLength={4} placeholder="2002" placeholderTextColor={Colors.textMuted} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>Club</Text><TextInput accessibilityLabel="Club de l’athlète" style={styles.input} value={club} onChangeText={setClub} placeholder="Nom du club" placeholderTextColor={Colors.textMuted} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>Numéro de licence</Text><TextInput accessibilityLabel="Numéro de licence" style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="Licence Swiss Athletics" placeholderTextColor={Colors.textMuted} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>Photo (adresse URL)</Text><TextInput accessibilityLabel="Adresse de la photo de l’athlète" style={styles.input} value={avatar} onChangeText={setAvatar} autoCapitalize="none" keyboardType="url" placeholder="https://..." placeholderTextColor={Colors.textMuted} /></View>

            {/* Events */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('athlete_events')}</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel={t('athlete_events')}
                value={eventsText}
                onChangeText={setEventsText}
                placeholder={t('enter_events')}
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.hint}>{t('events_hint')}</Text>
            </View>

            {/* Group */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('athlete_group')}</Text>
              <View style={styles.chipRow}>
                {groups.map(g => (
                  <Pressable
                    key={g.id}
                    onPress={() => setGroup(g.id)}
                    style={[
                      styles.chip,
                      group === g.id
                        ? { backgroundColor: g.color, borderColor: g.color }
                        : { backgroundColor: Colors.surface, borderColor: Colors.border },
                    ]}
                  >
                    <Text style={[styles.chipLabel, group === g.id ? { color: '#FFF' } : { color: Colors.textSecondary }]}>{groupLabel(g.id)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('status_label')}</Text>
              <View style={styles.chipRow}>
                {STATUS_OPTIONS.map(s => (
                  <Pressable
                    key={s.id}
                    onPress={() => setStatus(s.id)}
                    style={[
                      styles.chip,
                      status === s.id
                        ? { backgroundColor: s.color + '20', borderColor: s.color }
                        : { backgroundColor: Colors.surface, borderColor: Colors.border },
                    ]}
                  >
                    <MaterialIcons name={s.icon as any} size={14} color={status === s.id ? s.color : Colors.textMuted} />
                    <Text style={[styles.chipLabel, { color: status === s.id ? s.color : Colors.textSecondary }]}>
                      {t(s.id as any)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Personal Bests */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('pb_label')} <Text style={styles.optionalTag}>({t('optional')})</Text></Text>
              {pbs.map((pb, i) => (
                <View key={i} style={styles.pbRow}>
                  <View style={{ flex: 1 }}><Text style={styles.pbFieldLabel}>Épreuve</Text><TextInput accessibilityLabel={`Épreuve du PB ${i + 1}`} style={styles.input} value={pb.event} onChangeText={value => setPbs(previous => previous.map((entry, index) => index === i ? { ...entry, event: value } : entry))} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.pbFieldLabel}>Performance</Text><TextInput accessibilityLabel={`Performance du PB ${i + 1}`} style={styles.input} value={pb.perf} onChangeText={value => setPbs(previous => previous.map((entry, index) => index === i ? { ...entry, perf: value } : entry))} /></View>
                  <Pressable accessibilityLabel={`Supprimer le PB ${pb.event}`} style={({ pressed }) => [styles.removePbBtn, pressed ? { opacity: 0.7 } : null]} onPress={() => setPbs(prev => prev.filter((_, idx) => idx !== i))}>
                    <MaterialIcons name="close" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.pbInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  accessibilityLabel="Épreuve du nouveau PB"
                  value={pbEvent}
                  onChangeText={setPbEvent}
                  placeholder={t('event_label')}
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  accessibilityLabel="Performance du nouveau PB"
                  value={pbPerf}
                  onChangeText={setPbPerf}
                  placeholder={t('performance_label')}
                  placeholderTextColor={Colors.textMuted}
                />
                <Pressable accessibilityLabel="Ajouter ce PB" onPress={handleAddPb} style={({ pressed }) => [styles.pbAddBtn, pressed ? { opacity: 0.8 } : null]}>
                  <MaterialIcons name="add" size={22} color={Colors.primary} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.storageHint}>Les meilleurs résultats de compétition mettent automatiquement les PBs à jour. Pour corriger un PB issu d’une compétition, modifiez le résultat correspondant.</Text>
            <View style={styles.field}><Text style={styles.fieldLabel}>Notes</Text><TextInput accessibilityLabel="Notes sur l’athlète" style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Objectifs, blessures, informations utiles…" placeholderTextColor={Colors.textMuted} /></View>
            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                !name.trim() && styles.saveBtnDisabled,
                pressed && { opacity: 0.85 },

              ]}
              disabled={!name.trim() || !canEdit || Boolean(editId && !existing)}
            >
              <MaterialIcons name={existing ? 'check' : 'person-add'} size={20} color={Colors.textOnPrimary} />
              <Text style={styles.saveBtnText}>
                {existing ? t('save') : t('add_athlete')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Invite section */}
            <View style={[styles.inviteCard, Shadow.card]}>
              <View style={styles.inviteIconWrap}>
                <MaterialIcons name="link" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.inviteCardTitle}>{t('invite_athlete')}</Text>
              <Text verbatim selectable style={styles.inviteCardSub}>{invitation.link}</Text>
              <Text verbatim style={styles.availability}>{invitation.availability}</Text>
            </View>

            {/* Athlete name (for invite message) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('athlete_name')} <Text style={styles.optionalTag}>({t('optional')})</Text></Text>
              <TextInput
                style={styles.input}
                value={inviteName}
                onChangeText={setInviteName}
                placeholder={t('enter_name')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Email invite */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('invite_via_email')}</Text>
              <View style={styles.rowInput}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="athlete@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={handleInviteEmail}
                  style={({ pressed }) => [styles.sendBtn, !inviteEmail.trim() ? styles.sendBtnDisabled : null, pressed ? styles.pressed : null]}
                  disabled={!inviteEmail.trim()}
                >
                  <MaterialIcons name="email" size={18} color="#FFF" />
                  <Text style={styles.sendBtnText}>{t('send')}</Text>
                </Pressable>
              </View>
            </View>

            {/* SMS invite */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('invite_via_sms')}</Text>
              <View style={styles.rowInput}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={invitePhone}
                  onChangeText={setInvitePhone}
                  placeholder="+41 79 000 00 00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
                <Pressable
                  onPress={handleInviteSMS}
                  style={({ pressed }) => [styles.sendBtn, { backgroundColor: Colors.success }, !invitePhone.trim() ? styles.sendBtnDisabled : null, pressed ? styles.pressed : null]}
                  disabled={!invitePhone.trim()}
                >
                  <MaterialIcons name="sms" size={18} color="#FFF" />
                  <Text style={styles.sendBtnText}>{t('send')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>— {t('or_invite')} —</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Switch to manual */}
            <Pressable
              onPress={() => setTab('manual')}
              style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.75 }]}
            >
              <MaterialIcons name="person-add" size={18} color={Colors.primary} />
              <Text style={styles.switchBtnText}>{t('manual_entry')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  tabRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingHorizontal: Spacing.sm, minHeight: 48, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel: { flexShrink: 1, textAlign: 'center', fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  tabLabelActive: { color: '#FFF' },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 120 },
  field: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: 8 },
  optionalTag: { fontWeight: Typography.weightRegular, color: Colors.textMuted },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.xs },
  storageHint: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary, marginBottom: Spacing.md },
  pbFieldLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs },
  removePbBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, minHeight: 48,
  },
  chipLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold },
  pbRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm,
    marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.border,
  },
  pbEvent: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
  pbPerf: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  pbInputRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center' },
  pbAddBtn: {
    width: 48, height: 48, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary + '12',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16,
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: '#FFF' },

  // Invite
  inviteCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
  },
  inviteIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  inviteCardTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  inviteCardSub: { fontSize: Typography.fontSizeBase, color: Colors.info, textAlign: 'center' },
  availability: { fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  pressed: { opacity: 0.7 },
  rowInput: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 48,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: '#FFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.primary, backgroundColor: Colors.primary + '10',
  },
  switchBtnText: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.primary },
});
