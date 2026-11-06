// Powered by OnSpace.AI
// Club onboarding — for club administrators / federation managers
import React, { useState } from 'react';
import {
  View, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { LocalizedInput as TextInput } from '@/components/ui/LocalizedInput';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { ProfilePhotoPicker } from '@/components/feature/ProfilePhotoPicker';
import { OnboardingAccount } from '@/components/auth/OnboardingAccount';
import { useAuth } from '@/template';

const CLUB_TYPES = [
  { id: 'athletics_club', label: 'Club d\'athlétisme', icon: 'directions-run' },
  { id: 'regional_fed',   label: 'Fédération régionale', icon: 'account-balance' },
  { id: 'national_fed',   label: 'Fédération nationale', icon: 'flag' },
  { id: 'school',         label: 'École / Académie', icon: 'school' },
  { id: 'multi_sport',    label: 'Club multi-sports', icon: 'sports' },
];

const CLUB_ROLES = [
  { id: 'president',       label: 'Président(e)',           icon: 'stars' },
  { id: 'vice_president',  label: 'Vice-président(e)',      icon: 'star-half' },
  { id: 'secretary',       label: 'Secrétaire général(e)', icon: 'manage-accounts' },
  { id: 'treasurer',       label: 'Trésorier(ère)',         icon: 'account-balance-wallet' },
  { id: 'technical_dir',   label: 'Directeur/rice technique', icon: 'engineering' },
  { id: 'competition_dir', label: 'Resp. compétitions',    icon: 'emoji-events' },
  { id: 'youth_dir',       label: 'Resp. jeunesse',        icon: 'child-care' },
  { id: 'admin',           label: 'Administrateur/rice',   icon: 'admin-panel-settings' },
];

const SLIDES = [
  {
    icon: 'corporate-fare',
    color: Colors.club,
    title: 'Gestion du club',
    sub: 'Gérez vos coachs, athlètes et groupes depuis un seul endroit',
  },
  {
    icon: 'supervisor-account',
    color: Colors.clubDark,
    title: 'Inviter vos coachs',
    sub: 'Donnez accès à vos coachs et membres du comité selon votre abonnement',
  },
  {
    icon: 'bar-chart',
    color: Colors.clubDeep,
    title: 'Vue d\'ensemble',
    sub: 'Suivez les performances de toute votre structure et exportez les rapports',
  },
];

type Step = 'info' | 'account' | 'slides';

export default function ClubOnboardingScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { setOnboardingDone, updateUser, setLocked } = useApp();
  const { language } = useI18n();
  const [step, setStep] = useState<Step>('info');
  const [slideIndex, setSlideIndex] = useState(0);
  const photo = useProfilePhoto();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState('athletics_club');
  const [role, setRole] = useState('president');
  const [memberCount, setMemberCount] = useState('');
  const [city, setCity] = useState('');

  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;

  const handleContinue = () => {
    if (!firstName.trim() || !clubName.trim() || photo.busy) return;
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Administrateur Club';
    updateUser({
      userType: 'coach',
      name: fullName,
      ...(firstName.trim() || lastName.trim() ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
      email: email || '',
      avatar: photo.avatar,
      club: clubName || 'Athletics Club',
      role: role,
      accountType: 'club',
      isClubAdmin: true,
    });
    setStep('account');
  };

  const handleFinish = () => {
    if (!isLast) {
      setSlideIndex(prev => prev + 1);
    } else {
      if (!auth.user || !firstName.trim()) { setStep('account'); return; }
      setOnboardingDone(true);
      setLocked(false);
      router.replace('/(tabs)');
    }
  };

  if (step === 'account') return <OnboardingAccount profile={{ firstName: firstName.trim(), lastName: lastName.trim(), userType: 'coach', club: clubName.trim(), role, avatar: photo.avatar, accountType: 'club', isClubAdmin: true }} onBack={() => setStep('info')} onComplete={() => setStep('slides')} />;

  // ── Form step ───────────────────────────────────────────────────────────
  if (step === 'info') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1, width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
            </Pressable>
            <View style={styles.headerIconWrap}>
              <MaterialIcons name="corporate-fare" size={22} color="#10B981" />
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Profil de votre club</Text>
              <Text style={styles.subtitle}>Configurez votre structure pour inviter vos coachs et gérer vos athlètes</Text>
            </View>

            <ProfilePhotoPicker photo={photo} accentColor={Colors.club} club />

            {/* Name */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput accessibilityLabel="Prénom obligatoire" style={styles.input} placeholder="Marie" placeholderTextColor={Colors.textMuted} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput style={styles.input} placeholder="Dupont" placeholderTextColor={Colors.textMuted} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              </View>
            </View>



            {/* Club name + city */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 2 }]}>
                <Text style={styles.label}>Nom du club / organisation *</Text>
                <TextInput style={styles.input} placeholder="CA Lausanne" placeholderTextColor={Colors.textMuted} value={clubName} onChangeText={setClubName} autoCapitalize="words" />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>Ville</Text>
                <TextInput style={styles.input} placeholder="Lausanne" placeholderTextColor={Colors.textMuted} value={city} onChangeText={setCity} autoCapitalize="words" />
              </View>
            </View>

            {/* Club type */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Type de structure</Text>
              <View style={styles.chipGrid}>
                {CLUB_TYPES.map(ct => (
                  <Pressable
                    key={ct.id}
                    style={[styles.chip, clubType === ct.id && styles.chipActive]}
                    onPress={() => setClubType(ct.id)}
                  >
                    <MaterialIcons name={ct.icon as any} size={14} color={clubType === ct.id ? '#FFF' : Colors.club} />
                    <Text style={[styles.chipText, clubType === ct.id && styles.chipTextActive]}>{ct.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Role */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Votre rôle au sein du comité</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {CLUB_ROLES.map(r => (
                  <Pressable
                    key={r.id}
                    style={[styles.chip, role === r.id && styles.chipActive]}
                    onPress={() => setRole(r.id)}
                  >
                    <MaterialIcons name={r.icon as any} size={14} color={role === r.id ? '#FFF' : Colors.club} />
                    <Text style={[styles.chipText, role === r.id && styles.chipTextActive]}>{r.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Member count */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Nombre approximatif de membres <Text style={styles.optionalTag}>(optionnel)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="ex. 120"
                placeholderTextColor={Colors.textMuted}
                value={memberCount}
                onChangeText={setMemberCount}
                keyboardType="number-pad"
              />
            </View>

            {/* Club plan note */}
            <View style={styles.clubPlanNote}>
              <MaterialIcons name="info-outline" size={16} color="#10B981" />
              <Text style={styles.clubPlanNoteText}>
                Les plans Club permettent d'inviter vos coachs et membres du comité. Choisissez votre abonnement après la configuration.
              </Text>
            </View>

            <Text style={styles.skipNote}>Prénom et nom du club obligatoires. Le compte sera vérifié à l’étape suivante.</Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
              disabled={photo.busy || !firstName.trim() || !clubName.trim()}
              onPress={handleContinue}
            >
              <Text style={styles.ctaBtnText}>Continuer</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Feature slides ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Pressable style={styles.backBtn2} onPress={() => setStep('info')} hitSlop={8}>
        <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
      </Pressable>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
        <View style={[styles.slideIconWrap, { backgroundColor: slide.color }]}>
          <MaterialIcons name={slide.icon as any} size={56} color="#FFF" />
        </View>
        <View style={[styles.slideNumBadge, { backgroundColor: slide.color + '20', borderColor: slide.color }]}>
          <Text style={[styles.slideNumText, { color: slide.color }]}>{slideIndex + 1}/{SLIDES.length}</Text>
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSub}>{slide.sub}</Text>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.dot, i === slideIndex ? { backgroundColor: s.color, width: 20 } : { backgroundColor: Colors.border }]} />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, { backgroundColor: slide.color, marginHorizontal: Spacing.screenPadding, alignSelf: 'stretch' }, pressed && { opacity: 0.85 }]}
        onPress={handleFinish}
      >
        <Text style={styles.ctaBtnText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
        <MaterialIcons name={isLast ? 'check' : 'arrow-forward'} size={20} color="#FFF" />
      </Pressable>

      {/* Shortcut to upgrade */}
      {isLast ? (
        <Pressable
          style={styles.upgradeShortcut}
          onPress={() => {
            if (!auth.user) { setStep('account'); return; }
            setOnboardingDone(true);
            setLocked(false);
            router.replace({ pathname: '/upgrade', params: { track: 'club' } } as any);
          }}
        >
          <MaterialIcons name="corporate-fare" size={14} color="#10B981" />
          <Text style={styles.upgradeShortcutText}>Choisir mon plan Club maintenant</Text>
          <MaterialIcons name="chevron-right" size={14} color="#10B981" />
        </Pressable>
      ) : null}

      <View style={{ height: 24 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 4, alignSelf: 'stretch' },
  backBtn: { padding: 8 },
  backBtn2: { alignSelf: 'flex-start', padding: 12, marginLeft: Spacing.screenPadding, marginTop: 8 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.club + '15', alignItems: 'center', justifyContent: 'center' },
  scroll: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.md, gap: Spacing.md },
  titleWrap: { gap: 4 },
  title: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, lineHeight: 20 },
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldWrap: { gap: 6 },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  optionalTag: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.weightMedium },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: Typography.fontSizeBase, color: Colors.textPrimary },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.club, backgroundColor: Colors.club + '08' },
  chipActive: { backgroundColor: Colors.club, borderColor: Colors.club },
  chipText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.weightSemibold, color: Colors.club },
  chipTextActive: { color: '#FFF' },
  clubPlanNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.club + '12', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.club + '30' },
  clubPlanNoteText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.club, lineHeight: 20 },
  skipNote: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  footer: { width: '100%', maxWidth: 620, padding: Spacing.screenPadding, alignSelf: 'center' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.club, paddingVertical: 16, paddingHorizontal: 40, borderRadius: Radius.full },
  ctaBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold, color: '#FFF' },
  slide: { flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center', paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding * 1.5, gap: Spacing.lg },
  slideIconWrap: { width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  slideNumBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1.5, marginBottom: 8 },
  slideNumText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold },
  slideTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.weightExtrabold, color: Colors.textPrimary, textAlign: 'center' },
  slideSub: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing.lg },
  dot: { height: 8, borderRadius: 4 },
  upgradeShortcut: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: Colors.club + '12', borderWidth: 1, borderColor: Colors.club + '30' },
  upgradeShortcutText: { fontSize: Typography.fontSizeSM, color: Colors.club, fontWeight: Typography.weightSemibold },
});
