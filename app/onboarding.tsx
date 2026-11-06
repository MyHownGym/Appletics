// Powered by OnSpace.AI
// Onboarding v2 — only Coach & Athlete roles (committee removed)
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
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { TRACK_EVENTS } from '@/constants/config';
import { useResponsive } from '@/hooks/useResponsive';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { ProfilePhotoPicker } from '@/components/feature/ProfilePhotoPicker';
import { OnboardingWelcome } from '@/components/feature/OnboardingWelcome';
import { CoachAthleteCountField } from '@/components/feature/CoachAthleteCountField';
import { useCoachAthleteCount } from '@/hooks/useCoachAthleteCount';
import { useCoachRoles } from '@/hooks/useCoachRoles';
import { OnboardingAccount } from '@/components/auth/OnboardingAccount';
import { useAuth } from '@/template';

type Step = 'welcome' | 'select' | 'profile' | 'account' | 'slides';
type UserType = 'coach' | 'athlete';

const COACH_SLIDES = [
  { icon: 'event-note', color: '#FF5722', titleKey: 'onb_coach_1_title', subtitleKey: 'onb_coach_1_sub' },
  { icon: 'people', color: '#FF7043', titleKey: 'onb_coach_2_title', subtitleKey: 'onb_coach_2_sub' },
  { icon: 'emoji-events', color: '#FF8A65', titleKey: 'onb_coach_3_title', subtitleKey: 'onb_coach_3_sub' },
];

const ATHLETE_SLIDES = [
  { icon: 'directions-run', color: '#1A73E8', titleKey: 'onb_ath_1_title', subtitleKey: 'onb_ath_1_sub' },
  { icon: 'bar-chart', color: '#1E88E5', titleKey: 'onb_ath_2_title', subtitleKey: 'onb_ath_2_sub' },
  { icon: 'chat', color: '#42A5F5', titleKey: 'onb_ath_3_title', subtitleKey: 'onb_ath_3_sub' },
];

const strings: Record<string, Record<string, string>> = {
  fr: {
    onb_select_role: 'Bienvenue sur Appletics',
    onb_select_sub: 'Qui êtes-vous ?',
    onb_coach: 'Coach',
    onb_coach_desc: 'Créer des plans, gérer les athlètes, suivre les résultats',
    onb_athlete: 'Athlète',
    onb_athlete_desc: 'Voir votre entraînement, résultats et progression',
    onb_profile_title_coach: 'Votre profil coach',
    onb_profile_title_ath: 'Votre profil athlète',
    onb_profile_sub: 'Complétez vos informations pour personnaliser votre expérience',
    onb_firstname: 'Prénom', onb_lastname: 'Nom', onb_email: 'E-mail',
    onb_club: 'Club / Organisation', onb_coach_role: 'Votre rôle',
    onb_birthdate: 'Date de naissance', onb_license: 'Licence Swiss Athletics',
    onb_license_hint: 'Optionnel', onb_discipline: 'Épreuve(s) principale(s)',
    onb_discipline_hint: 'Touchez pour sélectionner',
    onb_continue: 'Continuer',
    onb_coach_1_title: "Créer des plans d'entraînement", onb_coach_1_sub: 'Créez et gérez des blocs hebdomadaires pour toute votre équipe',
    onb_coach_2_title: 'Gérer vos athlètes', onb_coach_2_sub: 'Suivez les performances, blessures, records et progression',
    onb_coach_3_title: 'Résultats de compétition', onb_coach_3_sub: 'Enregistrez les résultats et synchronisez avec Swiss Athletics',
    onb_ath_1_title: "Votre plan d'entraînement", onb_ath_1_sub: 'Consultez les séances de votre coach et votre programme',
    onb_ath_2_title: 'Suivre votre progression', onb_ath_2_sub: 'Vos records, résultats et performance dans le temps',
    onb_ath_3_title: 'Chat équipe', onb_ath_3_sub: 'Restez connecté avec votre coach et vos coéquipiers',
    onb_get_started: 'Commencer', onb_next: 'Suivant',
    skip_note: 'Tous les champs sont optionnels — modifiables dans les réglages',
  },
  en: {
    onb_select_role: 'Welcome to Appletics', onb_select_sub: 'Who are you?',
    onb_coach: 'Coach', onb_coach_desc: 'Create plans, manage athletes, track results',
    onb_athlete: 'Athlete', onb_athlete_desc: 'View your training, results and progress',
    onb_profile_title_coach: 'Your Coach Profile', onb_profile_title_ath: 'Your Athlete Profile',
    onb_profile_sub: 'Fill in your details to personalize your experience',
    onb_firstname: 'First Name', onb_lastname: 'Last Name', onb_email: 'Email',
    onb_club: 'Club / Organization', onb_coach_role: 'Your Role',
    onb_birthdate: 'Date of Birth', onb_license: 'Swiss Athletics License',
    onb_license_hint: 'Optional', onb_discipline: 'Main Event(s)',
    onb_discipline_hint: 'Tap to select',
    onb_continue: 'Continue',
    onb_coach_1_title: 'Build Training Plans', onb_coach_1_sub: 'Create and manage weekly blocks for your entire squad',
    onb_coach_2_title: 'Manage Athletes', onb_coach_2_sub: 'Track performance, injuries, PBs and progress',
    onb_coach_3_title: 'Competition Results', onb_coach_3_sub: 'Log results and sync with Swiss Athletics',
    onb_ath_1_title: 'Your Training Plan', onb_ath_1_sub: "View your coach's sessions and weekly schedule",
    onb_ath_2_title: 'Track Your Progress', onb_ath_2_sub: 'Your PBs, results and performance over time',
    onb_ath_3_title: 'Team Chat', onb_ath_3_sub: 'Stay connected with your coach and teammates',
    onb_get_started: 'Get Started', onb_next: 'Next',
    skip_note: 'All fields are optional — editable later in settings',
  },
  de: {
    onb_select_role: 'Willkommen bei Appletics', onb_select_sub: 'Wer sind Sie?',
    onb_coach: 'Trainer', onb_coach_desc: 'Trainingspläne erstellen, Athleten verwalten',
    onb_athlete: 'Athlet', onb_athlete_desc: 'Training, Ergebnisse und Fortschritt anzeigen',
    onb_profile_title_coach: 'Ihr Trainerprofil', onb_profile_title_ath: 'Ihr Athletenprofil',
    onb_profile_sub: 'Füllen Sie Ihre Daten aus',
    onb_firstname: 'Vorname', onb_lastname: 'Nachname', onb_email: 'E-Mail',
    onb_club: 'Verein', onb_coach_role: 'Funktion',
    onb_birthdate: 'Geburtsdatum', onb_license: 'Swiss Athletics Lizenz',
    onb_license_hint: 'Optional', onb_discipline: 'Hauptdisziplin(en)',
    onb_discipline_hint: 'Tippen zum Auswählen',
    onb_continue: 'Weiter',
    onb_coach_1_title: 'Trainingspläne', onb_coach_1_sub: 'Wöchentliche Blöcke für Ihren Kader',
    onb_coach_2_title: 'Athleten verwalten', onb_coach_2_sub: 'Leistung, Verletzungen, PBs',
    onb_coach_3_title: 'Wettkampfergebnisse', onb_coach_3_sub: 'Mit Swiss Athletics synchronisieren',
    onb_ath_1_title: 'Trainingsplan', onb_ath_1_sub: 'Einheiten Ihres Trainers ansehen',
    onb_ath_2_title: 'Fortschritt', onb_ath_2_sub: 'Ihre PBs und Leistung',
    onb_ath_3_title: 'Team-Chat', onb_ath_3_sub: 'Mit Trainer und Team in Kontakt',
    onb_get_started: 'Loslegen', onb_next: 'Weiter',
    skip_note: 'Alle Felder optional — in den Einstellungen bearbeitbar',
  },
  it: {
    onb_select_role: 'Benvenuto su Appletics', onb_select_sub: 'Chi sei?',
    onb_coach: 'Allenatore', onb_coach_desc: 'Crea piani, gestisci atleti, traccia risultati',
    onb_athlete: 'Atleta', onb_athlete_desc: 'Vedi il tuo allenamento, risultati e progressi',
    onb_profile_title_coach: 'Il tuo profilo allenatore', onb_profile_title_ath: 'Il tuo profilo atleta',
    onb_profile_sub: 'Compila le tue informazioni',
    onb_firstname: 'Nome', onb_lastname: 'Cognome', onb_email: 'Email',
    onb_club: 'Club', onb_coach_role: 'Ruolo',
    onb_birthdate: 'Data di nascita', onb_license: 'Licenza Swiss Athletics',
    onb_license_hint: 'Opzionale', onb_discipline: 'Discipline principali',
    onb_discipline_hint: 'Tocca per selezionare',
    onb_continue: 'Continua',
    onb_coach_1_title: 'Piani di allenamento', onb_coach_1_sub: 'Crea blocchi settimanali per la squadra',
    onb_coach_2_title: 'Gestisci atleti', onb_coach_2_sub: 'Traccia prestazioni e progressi',
    onb_coach_3_title: 'Risultati di gara', onb_coach_3_sub: 'Sincronizza con Swiss Athletics',
    onb_ath_1_title: 'Il tuo piano', onb_ath_1_sub: 'Vedi le sessioni del coach',
    onb_ath_2_title: 'Progressi', onb_ath_2_sub: 'I tuoi record e prestazioni',
    onb_ath_3_title: 'Chat squadra', onb_ath_3_sub: 'Connesso con coach e compagni',
    onb_get_started: 'Inizia', onb_next: 'Avanti',
    skip_note: 'Tutti i campi sono opzionali',
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { setOnboardingDone, updateUser, setLocked } = useApp();
  const { language, t } = useI18n();
  const [step, setStep] = useState<Step>('welcome');
  const athleteCount = useCoachAthleteCount();
  const { roles: coachRoles, roleLabel } = useCoachRoles();
  const [userType, setUserType] = useState<UserType>('coach');
  const [slideIndex, setSlideIndex] = useState(0);
  const photo = useProfilePhoto();
  const { maxContentWidth } = useResponsive();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [coachRole, setCoachRole] = useState('Head Coach');
  const [birthDate, setBirthDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [license, setLicense] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const lang = (language in strings) ? language : 'fr';
  const s = strings[lang];

  const slides = userType === 'coach' ? COACH_SLIDES : ATHLETE_SLIDES;
  const currentSlide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;

  const accentColor = userType === 'coach' ? '#FF5722' : '#1A73E8';
  const roleIcon = userType === 'coach' ? 'sports' : 'directions-run';

  const handleSelectRole = (type: UserType) => {
    setUserType(type);
    setStep('profile');
  };

  const handleProfileContinue = () => {
    if (!firstName.trim() || photo.busy || (userType === 'coach' && !athleteCount.valid)) return;
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') ||
      (userType === 'coach' ? roleLabel('Head Coach') : s.onb_athlete);
    updateUser({
      userType,
      name: fullName,
      ...(firstName.trim() || lastName.trim() ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
      email: email || '',
      avatar: photo.avatar,
      coachAthleteCount: userType === 'coach' ? athleteCount.value : undefined,
      club: club || 'Athletics Club',
      role: userType === 'coach' ? coachRole : 'Athlete',
      accountType: 'indie',
      isClubAdmin: false,
    });
    setStep('account');
    setSlideIndex(0);
  };

  const handleNext = () => {
    if (!isLast) {
      const next = slideIndex + 1;
      setSlideIndex(next);

    } else {
      if (!auth.user || !firstName.trim()) { setStep('account'); return; }
      setOnboardingDone(true);
      setLocked(false);
      router.replace('/(tabs)');
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const getSlideContent = (slide: any) => {
    if ('title' in slide) return { title: slide.title, sub: slide.sub };
    return { title: s[slide.titleKey] || slide.titleKey, sub: s[slide.subtitleKey] || slide.subtitleKey };
  };

  if (step === 'account') return <OnboardingAccount profile={{ firstName: firstName.trim(), lastName: lastName.trim(), userType, club: club.trim(), role: userType === 'coach' ? coachRole : 'Athlete', accountType: 'indie', isClubAdmin: false, avatar: photo.avatar, coachAthleteCount: userType === 'coach' ? athleteCount.value : undefined }} onBack={() => setStep('profile')} onComplete={() => { setStep('slides'); setSlideIndex(0); }} />;

  if (step === 'welcome') return <OnboardingWelcome onContinue={() => setStep('select')} onSignIn={() => router.push('/login')} />;

  // ─── STEP 1: Role Select ─────────────────────────────────────────────
  if (step === 'select') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <Pressable accessibilityLabel={t('Retour à l’introduction')} onPress={() => setStep('welcome')} style={({ pressed }) => [styles.selectBack, pressed ? styles.secondaryPressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} /></Pressable>
        <View style={styles.logoSection}>
          <Image source={require('@/assets/images/appletics-icon.png')} style={styles.logoIcon} contentFit="contain" />
        </View>
        <Text style={styles.selectTitle}>{s.onb_select_role}</Text>
        <Text style={styles.selectSub}>{s.onb_select_sub}</Text>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.roleCards}
        >
          {[
            { type: 'coach' as UserType, color: '#FF5722', icon: 'sports', label: s.onb_coach, desc: s.onb_coach_desc },
            { type: 'athlete' as UserType, color: '#1A73E8', icon: 'directions-run', label: s.onb_athlete, desc: s.onb_athlete_desc },
            { type: 'club' as any, color: '#10B981', icon: 'corporate-fare', label: 'Club / Fédération', desc: 'Gérer une structure, inviter des coachs, vue d\'ensemble' },
          ].map(role => (
            <Pressable
              key={role.type}
              style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={() => role.type === 'club' ? router.push('/club-onboarding') : handleSelectRole(role.type)}
            >
              <View style={[styles.roleIconWrap, { backgroundColor: role.color }]}>
                <MaterialIcons name={role.icon as any} size={32} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>{role.label}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={role.color} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── STEP 2: Profile Form ─────────────────────────────────────────────
  if (step === 'profile') {
    const profileTitle = userType === 'coach' ? s.onb_profile_title_coach : s.onb_profile_title_ath;

    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1, width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.profileHeader}>
            <Pressable onPress={() => setStep('select')} hitSlop={8} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
            </Pressable>
            <View style={[styles.profileHeaderIcon, { backgroundColor: accentColor + '15' }]}>
              <MaterialIcons name={roleIcon as any} size={22} color={accentColor} />
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.profileScroll, { width: '100%', maxWidth: Math.min(620, maxContentWidth), alignSelf: 'center' }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.profileTitle}>{profileTitle}</Text>
            <Text style={styles.profileSub}>{s.onb_profile_sub}</Text>
            <ProfilePhotoPicker photo={photo} accentColor={accentColor} />

            <View style={styles.fieldRow}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>{s.onb_firstname} *</Text>
                <TextInput accessibilityLabel={`${s.onb_firstname} *`} style={styles.fieldInput} placeholder="Jean" placeholderTextColor={Colors.textMuted} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>{s.onb_lastname}</Text>
                <TextInput style={styles.fieldInput} placeholder="Dupont" placeholderTextColor={Colors.textMuted} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              </View>
            </View>



            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{s.onb_club}</Text>
              <TextInput style={styles.fieldInput} placeholder="CA Genève" placeholderTextColor={Colors.textMuted} value={club} onChangeText={setClub} autoCapitalize="words" />
            </View>

            {userType === 'coach' ? (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{s.onb_coach_role}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {coachRoles.map(option => (
                    <Pressable accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: coachRole === option.id }} key={option.id} style={({ pressed }) => [styles.chip, coachRole === option.id ? { backgroundColor: accentColor, borderColor: accentColor } : null, pressed ? styles.secondaryPressed : null]} onPress={() => setCoachRole(option.id)}>
                      <Text style={[styles.chipText, coachRole === option.id ? { color: Colors.textOnPrimary } : null]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {userType === 'coach' ? <CoachAthleteCountField input={athleteCount} /> : null}

            {userType === 'athlete' ? (
              <>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{s.onb_birthdate}</Text>
                  <Pressable style={[styles.fieldInput, styles.fieldRow2]} onPress={() => setShowCalendar(v => !v)}>
                    <Text style={[{ fontSize: Typography.fontSizeBase, flex: 1 }, !birthDate && { color: Colors.textMuted }]}>{birthDate || 'YYYY-MM-DD'}</Text>
                    <MaterialIcons name="calendar-today" size={18} color={Colors.textMuted} />
                  </Pressable>
                  {showCalendar ? <MiniCalendar value={birthDate} onChange={(d) => { setBirthDate(d); setShowCalendar(false); }} /> : null}
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{s.onb_license} <Text style={styles.optionalTag}>{s.onb_license_hint}</Text></Text>
                  <TextInput style={styles.fieldInput} placeholder="Ex: 12345" placeholderTextColor={Colors.textMuted} value={license} onChangeText={setLicense} />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{s.onb_discipline}</Text>
                  <Pressable style={[styles.fieldInput, styles.fieldRow2]} onPress={() => setShowEventPicker(v => !v)}>
                    <Text style={[{ fontSize: Typography.fontSizeBase, flex: 1 }, selectedEvents.length === 0 && { color: Colors.textMuted }]} numberOfLines={1}>
                      {selectedEvents.length > 0 ? selectedEvents.join(', ') : s.onb_discipline_hint}
                    </Text>
                    <MaterialIcons name={showEventPicker ? 'expand-less' : 'expand-more'} size={20} color={Colors.textMuted} />
                  </Pressable>
                  {showEventPicker ? (
                    <View style={styles.eventPicker}>
                      {TRACK_EVENTS.map(ev => (
                        <Pressable key={ev} style={[styles.eventChip, selectedEvents.includes(ev) && { backgroundColor: accentColor, borderColor: accentColor }]} onPress={() => toggleEvent(ev)}>
                          <Text style={[styles.eventChipText, selectedEvents.includes(ev) && { color: '#FFF' }]}>{ev}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            <Text style={styles.skipNote}>Prénom obligatoire. Les autres informations de profil sont facultatives.</Text>
          </ScrollView>

          <View style={styles.profileFooter}>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, { backgroundColor: accentColor }, pressed || !firstName.trim() ? { opacity: 0.65 } : null]}
              disabled={!firstName.trim() || photo.busy || (userType === 'coach' && !athleteCount.valid)}
              onPress={handleProfileContinue}
            >
              <Text style={styles.ctaBtnText}>{s.onb_continue}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── STEP 3: Feature Slides ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Pressable style={styles.backBtn2} onPress={() => setStep('profile')} hitSlop={8}>
        <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
      </Pressable>

      <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.slide, { flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center' }]}>
        <View style={[styles.slideIconWrap, { backgroundColor: currentSlide.color }]}><MaterialIcons name={currentSlide.icon as any} size={56} color={Colors.textOnPrimary} /></View>
        <View style={[styles.slideNumBadge, { backgroundColor: currentSlide.color + '20', borderColor: currentSlide.color }]}><Text style={[styles.slideNumText, { color: currentSlide.color }]}>{slideIndex + 1}/{slides.length}</Text></View>
        <Text style={styles.slideTitle}>{getSlideContent(currentSlide).title}</Text>
        <Text style={styles.slideSub}>{getSlideContent(currentSlide).sub}</Text>
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((slide, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === slideIndex
                ? { backgroundColor: slide.color, width: 20 }
                : { backgroundColor: Colors.border },
            ]}
          />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.ctaBtn,
          { backgroundColor: currentSlide.color, marginHorizontal: Spacing.screenPadding, alignSelf: 'stretch' },
          pressed && { opacity: 0.85 },
        ]}
        onPress={handleNext}
      >
        <Text style={styles.ctaBtnText}>{isLast ? s.onb_get_started : s.onb_next}</Text>
        <MaterialIcons name={isLast ? 'check' : 'arrow-forward'} size={20} color="#FFF" />
      </Pressable>
      <View style={{ height: 24 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF', alignItems: 'center' },
  selectBack: { width: 48, height: 48, marginLeft: Spacing.screenPadding, marginTop: Spacing.sm, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  secondaryPressed: { opacity: 0.7 },
  logoSection: { marginTop: Spacing.sm, alignItems: 'center', marginBottom: 12 },
  logoIcon: { width: 64, height: 64, borderRadius: 16 },
  selectTitle: { fontSize: Typography.fontSizeXL, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  selectSub: { fontSize: Typography.fontSizeMD, color: Colors.textMuted, marginBottom: Spacing.lg },
  roleCards: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.screenPadding, gap: Spacing.md, paddingBottom: Spacing.xl },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  roleIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: Typography.fontSizeMD, fontWeight: '800', color: Colors.textPrimary },
  roleDesc: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 4, alignSelf: 'stretch',
  },
  backBtn: { padding: 8 },
  backBtn2: { alignSelf: 'flex-start', padding: 12, marginLeft: Spacing.screenPadding, marginTop: 8 },
  profileHeaderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileScroll: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16, gap: Spacing.md },
  profileTitle: { fontSize: Typography.fontSizeXL, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  profileSub: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, lineHeight: 20 },
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: Typography.fontSizeSM, fontWeight: '600', color: Colors.textSecondary },
  optionalTag: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: '400' },
  fieldInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: Typography.fontSizeBase, color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipText: { fontSize: Typography.fontSizeSM, fontWeight: '600', color: Colors.textSecondary },
  eventPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginTop: 4,
  },
  eventChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  eventChipText: { fontSize: Typography.fontSizeXS, fontWeight: '600', color: Colors.textSecondary },
  skipNote: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  profileFooter: { width: '100%', maxWidth: 620, padding: Spacing.screenPadding, alignSelf: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding * 1.5, gap: Spacing.lg },
  slideIconWrap: { width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  slideNumBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1.5, marginBottom: 8 },
  slideNumText: { fontSize: Typography.fontSizeSM, fontWeight: '700' },
  slideTitle: { fontSize: Typography.fontSizeXL, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  slideSub: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', gap: 6, marginVertical: Spacing.lg },
  dot: { height: 8, borderRadius: 4 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: 16, paddingHorizontal: 40, borderRadius: Radius.full,
  },
  ctaBtnText: { fontSize: Typography.fontSizeMD, fontWeight: '700', color: '#FFF' },
});
