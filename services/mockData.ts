// Powered by OnSpace.AI
// v4 - rich demo data: athletes, plans, competitions, results, channels
import { Athlete, TrainingPlan, TrainingSession, Competition, CompResult, ChatChannel, ChatMessage, ChatMember } from '@/types';

export const MOCK_USER = {
  id: 'user-1',
  name: 'Marc Dubois',
  role: 'Head Coach',
  club: 'CA Lausanne',
  avatar: null,
  email: 'marc.dubois@ca-lausanne.ch',
};

// ── Athlètes ────────────────────────────────────────────────────────────────
export const MOCK_ATHLETES: Athlete[] = [
  {
    id: 'ath-1',
    name: 'Emma Schneider',
    group: 'sprints',
    events: ['100m', '200m'],
    status: 'active',
    birthYear: 2002,
    pb: { '100m': '11.42', '200m': '23.18' },
    notes: 'Très bonne accélération. Focus sur la phase de transition 30-60m.',
  },
  {
    id: 'ath-2',
    name: 'Lucas Martin',
    group: 'sprints',
    events: ['100m', '4x100m'],
    status: 'active',
    birthYear: 2001,
    pb: { '100m': '10.68', '4x100m': '39.12' },
    notes: 'Meilleur relayeur de l\'équipe. Travail départ bloc à intensifier.',
  },
  {
    id: 'ath-3',
    name: 'Sofia Rossi',
    group: 'middle_distance',
    events: ['800m', '1500m'],
    status: 'active',
    birthYear: 2003,
    pb: { '800m': '2:08.34', '1500m': '4:22.10' },
    notes: 'Progression régulière. Doit améliorer son finish.',
  },
  {
    id: 'ath-4',
    name: 'Jonas Weber',
    group: 'middle_distance',
    events: ['1500m', '5000m'],
    status: 'active',
    birthYear: 2000,
    pb: { '1500m': '3:48.72', '5000m': '13:52.44' },
    notes: 'Très bonne endurance de base. Saison prometteuse.',
  },
  {
    id: 'ath-5',
    name: 'Léa Müller',
    group: 'hurdles',
    events: ['100m haies', '400m haies'],
    status: 'active',
    birthYear: 2002,
    pb: { '100m haies': '13.21', '400m haies': '57.88' },
    notes: 'Technique de franchissement en amélioration. PB en vue.',
  },
  {
    id: 'ath-6',
    name: 'Antoine Favre',
    group: 'throws',
    events: ['Lancer du poids', 'Lancer du disque'],
    status: 'injured',
    birthYear: 1999,
    pb: { 'Lancer du poids': '16.84m', 'Lancer du disque': '52.30m' },
    notes: 'Épaule droite — arrêt 4-6 semaines. Rééducation en cours.',
  },
  {
    id: 'ath-7',
    name: 'Nina Keller',
    group: 'jumps',
    events: ['Saut en longueur', 'Triple saut'],
    status: 'active',
    birthYear: 2004,
    pb: { 'Saut en longueur': '6.23m', 'Triple saut': '13.18m' },
    notes: 'Très talentueuse. Première saison senior.',
  },
  {
    id: 'ath-8',
    name: 'Romain Blanc',
    group: 'sprints',
    events: ['400m', '4x400m'],
    status: 'active',
    birthYear: 2001,
    pb: { '400m': '46.34', '4x400m': '3:08.20' },
    notes: 'Bon potentiel. Gestion de course à améliorer.',
  },
];

// ── Plans d'entraînement ─────────────────────────────────────────────────────
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const MOCK_TRAINING_PLANS: TrainingPlan[] = [
  {
    id: 'plan-1',
    title: 'Bloc Vitesse — Sprinters',
    description: 'Développement de la vitesse maximale et de l\'endurance spécifique 100-200m.',
    phase: 'Pic de forme',
    group: 'sprints',
    athleteIds: ['ath-1', 'ath-2', 'ath-8'],
    startDate: fmt(addDays(today, -14)),
    endDate: fmt(addDays(today, 28)),
    weeks: 6,
    sessions: [
      {
        id: 'ses-1', day: 'Lun', sessionDate: fmt(addDays(today, 1)),
        title: 'Vitesse maximale',
        type: 'track', intensity: 'hard', duration: 90,
        details: '3x(3x60m) @max, récup 3min entre reps, 8min entre séries. Départ bloc obligatoire.',
      },
      {
        id: 'ses-2', day: 'Mar', sessionDate: fmt(addDays(today, 2)),
        title: 'Circuit Gym — Force',
        type: 'gym', intensity: 'moderate', duration: 60,
        details: 'Squat 4x6, Fentes 3x12, Nordic Curl 4x8, Gainage 3x45s.',
      },
      {
        id: 'ses-3', day: 'Mer', sessionDate: fmt(addDays(today, 3)),
        title: 'Récupération active',
        type: 'road', intensity: 'easy', duration: 45,
        details: 'Footing léger 30min + étirements dynamiques.',
      },
      {
        id: 'ses-4', day: 'Jeu', sessionDate: fmt(addDays(today, 4)),
        title: 'Endurance Spécifique',
        type: 'track', intensity: 'hard', duration: 80,
        details: '4x200m @95%, récup 8min. Puis 3x100m @max, récup 10min.',
      },
      {
        id: 'ses-5', day: 'Sam', sessionDate: fmt(addDays(today, 6)),
        title: 'Séance compétition simulée',
        type: 'track', intensity: 'race', duration: 120,
        details: 'Départs réactifs, chronos officiels sur 60m, 100m et 200m.',
      },
    ],
  },
  {
    id: 'plan-2',
    title: 'Préparation Demi-Fond',
    description: 'Développement de l\'endurance fondamentale et du seuil lactique.',
    phase: 'Développement',
    group: 'middle_distance',
    athleteIds: ['ath-3', 'ath-4'],
    startDate: fmt(addDays(today, -21)),
    endDate: fmt(addDays(today, 21)),
    weeks: 6,
    sessions: [
      {
        id: 'ses-6', day: 'Lun', sessionDate: fmt(addDays(today, 1)),
        title: 'Seuil lactique',
        type: 'road', intensity: 'moderate', duration: 75,
        details: '2x20min @seuil (allure 1500m +30s), récup 5min jogging.',
      },
      {
        id: 'ses-7', day: 'Mar', sessionDate: fmt(addDays(today, 2)),
        title: 'Récupération + core',
        type: 'gym', intensity: 'easy', duration: 50,
        details: 'Gainage 5x1min, squats lents 3x15, yoga 20min.',
      },
      {
        id: 'ses-8', day: 'Jeu', sessionDate: fmt(addDays(today, 4)),
        title: 'VMA courte',
        type: 'track', intensity: 'hard', duration: 65,
        details: '10x400m @VMA, récup 90s. Objectif maintenir l\'allure sur toutes les reps.',
      },
      {
        id: 'ses-9', day: 'Sam', sessionDate: fmt(addDays(today, 6)),
        title: 'Sortie longue',
        type: 'road', intensity: 'easy', duration: 90,
        details: '80min footing en forêt, allure confortable. Dénivelé recommandé.',
      },
    ],
  },
  {
    id: 'plan-3',
    title: 'Haies — Technique & Vitesse',
    description: 'Amélioration de la technique de franchissement et vitesse entre haies.',
    phase: 'Pic de forme',
    group: 'hurdles',
    athleteIds: ['ath-5'],
    startDate: fmt(addDays(today, -7)),
    endDate: fmt(addDays(today, 35)),
    weeks: 6,
    sessions: [
      {
        id: 'ses-10', day: 'Lun', sessionDate: fmt(addDays(today, 1)),
        title: 'Technique franchissement',
        type: 'track', intensity: 'moderate', duration: 70,
        details: 'Exercices spécifiques haie : jambe d\'attaque, jambe d\'appui, côté fort/faible. Haies basses puis normales.',
      },
      {
        id: 'ses-11', day: 'Mer', sessionDate: fmt(addDays(today, 3)),
        title: 'Sprint haies 60m',
        type: 'track', intensity: 'hard', duration: 75,
        details: '6x60m haies @95%, récup 6min. Focus sur 3 foulées entre haies.',
      },
    ],
  },
];

// ── Compétitions ─────────────────────────────────────────────────────────────
export const MOCK_COMPETITIONS: Competition[] = [
  {
    id: 'comp-1',
    name: 'Meeting de Lausanne',
    date: fmt(addDays(today, 5)),
    venue: 'Stade Pierre-de-Coubertin, Lausanne',
    type: 'Outdoor',
    status: 'upcoming',
    events: ['100m', '200m', '400m', '800m', '100m haies', 'Saut en longueur'],
    athleteIds: ['ath-1', 'ath-2', 'ath-5', 'ath-7'],
    teamScore: undefined,
    teamRank: undefined,
  },
  {
    id: 'comp-2',
    name: 'Championnats Vaudois',
    date: fmt(addDays(today, 19)),
    endDate: fmt(addDays(today, 20)),
    venue: 'Stade Olympique, Lausanne',
    type: 'Outdoor',
    status: 'upcoming',
    events: ['100m', '200m', '400m', '800m', '1500m', '5000m', '100m haies', '400m haies', 'Saut en longueur', 'Triple saut', 'Lancer du poids'],
    athleteIds: ['ath-1', 'ath-2', 'ath-3', 'ath-4', 'ath-5', 'ath-7', 'ath-8'],
  },
  {
    id: 'comp-3',
    name: 'Meeting Indoor Genève',
    date: fmt(addDays(today, -30)),
    venue: 'Halle des Sports, Genève',
    type: 'Indoor',
    status: 'completed',
    events: ['60m', '200m', '400m', '800m', '60m haies'],
    athleteIds: ['ath-1', 'ath-2', 'ath-3', 'ath-5'],
    teamScore: 47,
    teamRank: 3,
  },
  {
    id: 'comp-4',
    name: 'Cross Cantonal',
    date: fmt(addDays(today, -60)),
    venue: 'Forêt de Sauvabelin, Lausanne',
    type: 'Outdoor',
    status: 'completed',
    events: ['Cross court', 'Cross long'],
    athleteIds: ['ath-3', 'ath-4'],
    teamScore: 28,
    teamRank: 2,
  },
];

// ── Résultats ─────────────────────────────────────────────────────────────────
export const MOCK_RESULTS: CompResult[] = [
  // Meeting Indoor Genève — comp-3
  { id: 'res-1', competitionId: 'comp-3', athleteId: 'ath-1', event: '60m',       result: '7.42',   rank: 2, pb: false, notes: '' },
  { id: 'res-2', competitionId: 'comp-3', athleteId: 'ath-1', event: '200m',      result: '23.18',  rank: 1, pb: true,  notes: 'Nouveau PB ! Excellent finish.' },
  { id: 'res-3', competitionId: 'comp-3', athleteId: 'ath-2', event: '60m',       result: '6.84',   rank: 1, pb: true,  notes: 'Meilleure perf de sa carrière.' },
  { id: 'res-4', competitionId: 'comp-3', athleteId: 'ath-2', event: '200m',      result: '21.52',  rank: 3, pb: false, notes: '' },
  { id: 'res-5', competitionId: 'comp-3', athleteId: 'ath-3', event: '800m',      result: '2:08.34',rank: 2, pb: true,  notes: 'PB. Très bon finish sur les 200 derniers mètres.' },
  { id: 'res-6', competitionId: 'comp-3', athleteId: 'ath-5', event: '60m haies', result: '8.31',   rank: 2, pb: false, notes: 'Bon franchissement, quelques fautes techniques.' },

  // Cross Cantonal — comp-4
  { id: 'res-7', competitionId: 'comp-4', athleteId: 'ath-3', event: 'Cross court', result: '12:34', rank: 3, pb: false, notes: '' },
  { id: 'res-8', competitionId: 'comp-4', athleteId: 'ath-4', event: 'Cross long',  result: '28:12', rank: 1, pb: true,  notes: 'Victoire ! Excellent rythme tout au long de la course.' },
];

// ── Canaux de chat ────────────────────────────────────────────────────────────
const COACH_MEMBER: ChatMember = { id: 'user-1', name: 'Marc Dubois', role: 'coach' };

export const MOCK_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-1',
    name: 'Sprinters 🏃',
    type: 'group',
    memberCount: 4,
    lastMessage: 'Rappel : séance mardi à 17h30 !',
    lastTime: '10:30',
    unread: 2,
    members: [
      COACH_MEMBER,
      { id: 'ath-1', name: 'Emma Schneider', role: 'athlete' },
      { id: 'ath-2', name: 'Lucas Martin', role: 'athlete' },
      { id: 'ath-8', name: 'Romain Blanc', role: 'athlete' },
    ],
  },
  {
    id: 'chan-2',
    name: 'Demi-fond 🎯',
    type: 'group',
    memberCount: 3,
    lastMessage: 'Belles séances cette semaine !',
    lastTime: 'Hier',
    unread: 0,
    members: [
      COACH_MEMBER,
      { id: 'ath-3', name: 'Sofia Rossi', role: 'athlete' },
      { id: 'ath-4', name: 'Jonas Weber', role: 'athlete' },
    ],
  },
  {
    id: 'chan-3',
    name: 'Staff CA Lausanne',
    type: 'staff',
    memberCount: 2,
    lastMessage: 'Réunion jeudi 18h.',
    lastTime: 'Lun',
    unread: 1,
    members: [
      COACH_MEMBER,
      { id: 'coach-2', name: 'Pierre Fontaine', role: 'coach' },
    ],
  },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'chan-1': [
    { id: 'm1', senderId: 'user-1', senderName: 'Marc Dubois', text: 'Bonjour l\'équipe ! Super séance hier soir 💪', time: '09:00', isOwn: true },
    { id: 'm2', senderId: 'ath-1',  senderName: 'Emma Schneider', text: 'Merci coach ! Mes jambes sont un peu lourdes ce matin 😅', time: '09:12', isOwn: false },
    { id: 'm3', senderId: 'ath-2',  senderName: 'Lucas Martin', text: 'Idem, mais c\'est bon signe !', time: '09:15', isOwn: false },
    { id: 'm4', senderId: 'user-1', senderName: 'Marc Dubois', text: 'Normal après les 60m @max. Récup légère aujourd\'hui, piscine ou vélo 30min.', time: '09:18', isOwn: true },
    { id: 'm5', senderId: 'ath-8',  senderName: 'Romain Blanc', text: 'Coach, je peux venir 30min plus tôt demain ?', time: '10:01', isOwn: false },
    { id: 'm6', senderId: 'user-1', senderName: 'Marc Dubois', text: 'Rappel : séance mardi à 17h30 !', time: '10:30', isOwn: true },
  ],
  'chan-2': [
    { id: 'm7', senderId: 'user-1', senderName: 'Marc Dubois', text: 'Bravo pour la sortie longue de samedi, très bon rythme !', time: 'Hier', isOwn: true },
    { id: 'm8', senderId: 'ath-3',  senderName: 'Sofia Rossi', text: 'Merci ! Je sens vraiment une progression depuis 3 semaines.', time: 'Hier', isOwn: false },
    { id: 'm9', senderId: 'ath-4',  senderName: 'Jonas Weber', text: 'Belles séances cette semaine !', time: 'Hier', isOwn: false },
  ],
  'chan-3': [
    { id: 'm10', senderId: 'coach-2', senderName: 'Pierre Fontaine', text: 'Marc, tu peux vérifier les inscriptions pour le meeting du 5 ?', time: 'Lun', isOwn: false },
    { id: 'm11', senderId: 'user-1',  senderName: 'Marc Dubois', text: 'Oui, je m\'en occupe ce soir.', time: 'Lun', isOwn: true },
    { id: 'm12', senderId: 'coach-2', senderName: 'Pierre Fontaine', text: 'Réunion jeudi 18h.', time: 'Lun', isOwn: false },
  ],
};
