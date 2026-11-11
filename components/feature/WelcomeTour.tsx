import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/template';
import { claimTour, markSeenLocal, markTourSeen, onReplayTour, releaseTour, seenLocal, tourSeen } from '@/services/tourStore';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface Step { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string; colors: [string, string] }
const ORANGE: [string, string] = ['#E2461A', '#FF8A65'];
const BLUE: [string, string] = ['#1557B0', '#5E9EF4'];
const GREEN: [string, string] = ['#0B8A5F', '#4ADE9F'];
const PURPLE: [string, string] = ['#6D28D9', '#A78BFA'];

const COACH: Step[] = [
  { icon: 'waving-hand', title: 'Bienvenue sur Appletics', text: 'Moins d’admin, plus de piste. En 1 minute, voici l’essentiel. Tu peux passer à tout moment.', colors: ORANGE },
  { icon: 'group-add', title: 'Invite tes athlètes', text: 'Ajoute tes athlètes puis envoie-leur une invitation par lien, e-mail ou SMS. Leur compte est gratuit.', colors: BLUE },
  { icon: 'event-note', title: 'Crée un plan', text: 'Plans → +. Ajoute tes séances : tes athlètes les reçoivent automatiquement et saisissent leurs temps.', colors: ORANGE },
  { icon: 'emoji-events', title: 'Compétitions et résultats', text: 'Ajoute une compétition, entre les résultats (ou importe-les depuis Swiss Athletics) : records et stats se mettent à jour.', colors: PURPLE },
  { icon: 'forum', title: 'Chat de groupe et privé', text: 'Écris à tout le groupe ou à un athlète, avec photos et fichiers. Active les notifications pour ne rien rater.', colors: GREEN },
];
const CLUB: Step[] = [
  { icon: 'waving-hand', title: 'Bienvenue sur Appletics', text: 'L’espace de ton club : coachs, athlètes, plans et compétitions au même endroit.', colors: GREEN },
  { icon: 'badge', title: 'Ajoute tes coachs', text: 'Invite les coachs du club : chacun gère ses groupes, tu gardes la vue d’ensemble.', colors: BLUE },
  { icon: 'groups', title: 'Groupes et athlètes', text: 'Crée les groupes d’entraînement et invite les athlètes. Leur compte est gratuit.', colors: ORANGE },
  { icon: 'emoji-events', title: 'Compétitions du club', text: 'Planifie les compétitions, suis les inscriptions et les résultats de tout le club.', colors: PURPLE },
  { icon: 'forum', title: 'Communication', text: 'Un chat par groupe et des messages privés, avec notifications : fini les 40 groupes WhatsApp.', colors: GREEN },
];
const ATHLETE: Step[] = [
  { icon: 'waving-hand', title: 'Bienvenue sur Appletics', text: 'Ton coach t’envoie tes séances ici. En 1 minute, voici l’essentiel.', colors: BLUE },
  { icon: 'today', title: 'Tes séances', text: 'Accueil → Aujourd’hui, et l’onglet Plans pour toute la semaine. Les séances arrivent toutes seules.', colors: ORANGE },
  { icon: 'timer', title: 'Saisis tes temps', text: 'Après l’entraînement, ouvre la séance et note tes chronos ou mesures : ton coach les voit tout de suite.', colors: BLUE },
  { icon: 'emoji-events', title: 'Compétitions et records', text: 'Tes compétitions, tes résultats et tes records personnels, avec ta progression en graphique.', colors: PURPLE },
  { icon: 'forum', title: 'Parle à ton coach', text: 'Le chat du groupe et les messages privés. Active les notifications pour ne rien manquer.', colors: GREEN },
];
const INSTALL: Step = { icon: 'add-to-home-screen', title: 'Ajoute-la à ton écran d’accueil', text: 'iPhone / iPad : Safari → Partager → « Sur l’écran d’accueil ». Android : Chrome → menu → « Installer l’application ». Elle s’ouvre alors comme une vraie app.', colors: ORANGE };

const standalone = () => Platform.OS !== 'web' || (typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true));

// First-launch tour by account type (coach, club, athlete). Skippable; replay from Settings.
export function WelcomeTour() {
  const { user, onboardingDone } = useApp();
  const { user: authUser } = useAuth();
  const uid = authUser?.id ?? '';
  const [visible, setVisible] = useState(false);
  const owner = useRef(Symbol('tour'));
  const [index, setIndex] = useState(0);
  const steps = useMemo(() => {
    const base = user.userType === 'athlete' ? ATHLETE : user.accountType === 'club' ? CLUB : COACH;
    return standalone() ? base : [...base, INSTALL];
  }, [user.userType, user.accountType]);
  useEffect(() => {
    if (!uid || !onboardingDone) return;
    let alive = true;
    void tourSeen(uid).then(seen => {
      if (!alive || seen || seenLocal(uid) || !claimTour(owner.current)) return;
      setIndex(0); setVisible(true);
    });
    return () => { alive = false; releaseTour(owner.current); };
  }, [uid, onboardingDone]);
  useEffect(() => onReplayTour(() => { if (!claimTour(owner.current)) return; setIndex(0); setVisible(true); }), []);
  const close = () => { setVisible(false); releaseTour(owner.current); if (uid) { markSeenLocal(uid); void markTourSeen(uid); } };
  if (!visible) return null;
  const step = steps[Math.min(index, steps.length - 1)];
  const last = index >= steps.length - 1;
  return <Modal visible transparent animationType="fade" onRequestClose={close}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <LinearGradient colors={step.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.skip, pressed ? { opacity: 0.7 } : null]}><Text style={styles.skipText}>Passer</Text></Pressable>
          <View style={styles.iconCircle}><MaterialIcons name={step.icon} size={44} color="#FFFFFF" /></View>
        </LinearGradient>
        <View style={styles.body}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>
          <View style={styles.dots}>{steps.map((_, i) => <View key={i} style={[styles.dot, i === index ? [styles.dotActive, { backgroundColor: step.colors[0] }] : null]} />)}</View>
          <View style={styles.actions}>
            {index > 0 ? <Pressable accessibilityRole="button" onPress={() => setIndex(i => i - 1)} style={({ pressed }) => [styles.secondary, pressed ? { opacity: 0.7 } : null]}><Text style={styles.secondaryText}>Retour</Text></Pressable> : <View style={{ flex: 1 }} />}
            <Pressable accessibilityRole="button" onPress={() => (last ? close() : setIndex(i => i + 1))} style={({ pressed }) => [styles.primary, { backgroundColor: step.colors[0] }, pressed ? { opacity: 0.85 } : null]}>
              <Text style={styles.primaryText}>{last ? 'C’est parti' : 'Suivant'}</Text>
              <MaterialIcons name={last ? 'check' : 'arrow-forward'} size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 420, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.surface },
  hero: { height: 190, alignItems: 'center', justifyContent: 'center' },
  skip: { position: 'absolute', top: 14, right: 14, paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' },
  skipText: { color: '#FFFFFF', fontWeight: '700', fontSize: Typography.fontSizeSM },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: Typography.fontSizeXL, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  text: { fontSize: Typography.fontSizeBase, lineHeight: 23, color: Colors.textSecondary, textAlign: 'center', minHeight: 70 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 22 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  secondary: { flex: 1, height: 50, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  secondaryText: { fontWeight: '700', color: Colors.textSecondary },
  primary: { flex: 1.4, height: 50, borderRadius: Radius.lg, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontWeight: '800', color: '#FFFFFF', fontSize: Typography.fontSizeBase },
});
