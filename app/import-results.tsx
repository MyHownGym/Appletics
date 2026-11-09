import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useApp } from '@/hooks/useApp';
import { useActivityScope } from '@/hooks/useActivityScope';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { sharedStyles as styles } from '@/constants/sharedStyles';
import { Colors, Spacing } from '@/constants/theme';
import { webScroll } from '@/constants/webScroll';
import { getAthleteSearchUrl } from '@/services/swissAthleticsService';
import { parseSwissResults, type ParsedSwissResult } from '@/services/swissResultsParser';
import { normalizeEvent } from '@/services/athletePerformanceService';
import type { Competition } from '@/types';

const norm = (text: string) => text.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (text: string) => norm(text).replace(/ /g, '-').slice(0, 40) || 'meeting';
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });

// Import of results copied from swiss-athletics.ch: competitions are created (or reused) and PBs follow.
export default function ImportResultsScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { openLink } = useExternalLinks();
  const params = useLocalSearchParams<{ athleteId?: string }>();
  const { athletes, competitions, results, addCompetition, updateCompetition, addResult } = useApp();
  const scope = useActivityScope();
  const athlete = athletes.find(item => item.id === params.athleteId) ?? scope.athlete ?? null;
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ParsedSwissResult[] | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  // A competition already in the app: same date and similar name or place.
  const competitionFor = (row: ParsedSwissResult): Competition | undefined => competitions.find(item => item.date.slice(0, 10) === row.date && (
    !row.competition || norm(item.name).includes(norm(row.competition)) || norm(row.competition).includes(norm(item.name))
    || (!!row.place && [item.venue, item.location].some(value => value && norm(value) === norm(row.place)))));
  const known = useMemo(() => {
    const set = new Set<string>();
    if (!athlete || !rows) return set;
    for (const row of rows) {
      const competition = competitionFor(row);
      if (competition && results.some(item => item.athleteId === athlete.id && item.competitionId === competition.id && normalizeEvent(item.event) === normalizeEvent(row.event))) set.add(row.key);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, athlete, results, competitions]);
  const selected = (rows ?? []).filter(row => !known.has(row.key) && !skipped.has(row.key));

  const analyse = () => {
    const parsed = parseSwissResults(text).sort((a, b) => b.date.localeCompare(a.date));
    setRows(parsed); setSkipped(new Set());
    if (!parsed.length) showAlert('Aucun résultat reconnu', 'Copiez le tableau des résultats (épreuve, résultat, date) depuis swiss-athletics.ch, puis collez-le ici.');
  };

  const importNow = () => {
    if (!athlete || !selected.length) return;
    const created = new Map<string, Competition>();
    // Oldest first, so that each result's PB badge is the PB at that time.
    for (const row of [...selected].sort((a, b) => a.date.localeCompare(b.date))) {
      const existing = competitionFor(row) ?? created.get(`${row.date}|${norm(row.competition || row.place)}`);
      let competition: Competition;
      if (existing) {
        competition = { ...existing, events: existing.events.some(event => normalizeEvent(event) === normalizeEvent(row.event)) ? existing.events : [...existing.events, row.event], athleteIds: existing.athleteIds.includes(athlete.id) ? existing.athleteIds : [...existing.athleteIds, athlete.id] };
        if (created.has(`${row.date}|${norm(row.competition || row.place)}`)) addCompetition(competition); else updateCompetition(competition);
      } else {
        competition = {
          id: `sa-${row.date}-${slug(row.competition || row.place)}`, name: row.competition || row.place || 'Compétition', type: 'meeting', date: row.date,
          venue: row.place, status: 'completed', events: [row.event], athleteIds: [athlete.id],
        };
        addCompetition(competition);
      }
      created.set(`${row.date}|${norm(row.competition || row.place)}`, competition);
      addResult({ id: `sa-${athlete.id}-${row.date}-${slug(row.event)}-${row.result.replace(/[^0-9]/g, '')}`, competitionId: competition.id, athleteId: athlete.id, event: row.event, result: row.result, rank: row.rank, pb: false, notes: row.wind });
    }
    showAlert('Import terminé', `${selected.length} résultat(s) ajouté(s) pour ${athlete.name}. Les records personnels sont mis à jour.`);
    setRows(null); setText('');
  };

  if (!athlete) return <SafeAreaView style={styles.screen} edges={['top']}><View style={styles.header}><Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={styles.iconButton}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.title}>Importer des résultats</Text></View><View style={styles.content}><Text style={styles.body}>Athlète introuvable.</Text></View></SafeAreaView>;

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable>
      <Text style={styles.title}>Importer depuis Swiss Athletics</Text>
    </View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.flex, webScroll]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text verbatim style={styles.heading}>{athlete.name}</Text>
          <Text style={styles.body}>1. Ouvrez le profil de l’athlète sur swiss-athletics.ch.</Text>
          <Text style={styles.body}>2. Sélectionnez le tableau des résultats (avec les titres des épreuves) et copiez-le.</Text>
          <Text style={styles.body}>3. Collez-le ci-dessous puis touchez « Analyser ».</Text>
          <Pressable accessibilityRole="link" onPress={() => openLink(getAthleteSearchUrl(athlete.name))} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}>
            <Text style={styles.link}>Ouvrir Swiss Athletics</Text>
          </Pressable>
        </View>
        {!rows ? <View style={styles.card}>
          <Text style={styles.label}>Résultats copiés</Text>
          <TextInput accessibilityLabel="Résultats copiés" value={text} onChangeText={setText} multiline textAlignVertical="top" autoCorrect={false} autoCapitalize="none"
            placeholder={'100 m\n10.65  +1.8  3f1  Meeting de Genève  Genève  14.06.2026'} placeholderTextColor={Colors.textMuted} style={[styles.input, { minHeight: 180 }]} />
          <Pressable accessibilityRole="button" disabled={!text.trim()} onPress={analyse} style={({ pressed }) => [styles.button, pressed || !text.trim() ? styles.pressed : null]}>
            <MaterialIcons name="auto-awesome" size={20} color={Colors.textOnPrimary} /><Text style={styles.buttonText}>Analyser</Text>
          </Pressable>
        </View> : <>
          <View style={styles.card}>
            <Text style={styles.heading}>{`${rows.length} résultat(s) reconnu(s)`}</Text>
            {known.size ? <Text style={styles.subtle}>{`${known.size} déjà dans l’app (ignoré${known.size > 1 ? 's' : ''}).`}</Text> : null}
            <Text style={styles.subtle}>Touchez une ligne pour l’exclure.</Text>
          </View>
          {rows.map(row => {
            const already = known.has(row.key), off = already || skipped.has(row.key);
            return <Pressable key={row.key} accessibilityRole="checkbox" accessibilityState={{ checked: !off, disabled: already }} disabled={already}
              onPress={() => setSkipped(previous => { const next = new Set(previous); if (next.has(row.key)) next.delete(row.key); else next.add(row.key); return next; })}
              style={({ pressed }) => [styles.card, { opacity: off ? 0.45 : 1, gap: Spacing.xs }, pressed ? styles.pressed : null]}>
              <View style={styles.row}>
                <MaterialIcons name={off ? 'check-box-outline-blank' : 'check-box'} size={22} color={off ? Colors.textMuted : Colors.primary} />
                <Text verbatim style={[styles.body, { flex: 1, fontWeight: '700' }]}>{row.event}</Text>
                <Text verbatim style={styles.amount}>{row.result}</Text>
              </View>
              <Text verbatim style={styles.subtle}>{[dateLabel(row.date), row.competition, row.place, row.wind ? `vent ${row.wind}` : '', row.rank ? `${row.rank}${row.rank === 1 ? 'er' : 'e'}` : '', already ? 'déjà importé' : ''].filter(Boolean).join(' · ')}</Text>
            </Pressable>;
          })}
          <Pressable accessibilityRole="button" disabled={!selected.length} onPress={importNow} style={({ pressed }) => [styles.button, pressed || !selected.length ? styles.pressed : null]}>
            <MaterialIcons name="download" size={20} color={Colors.textOnPrimary} /><Text style={styles.buttonText}>{`Importer ${selected.length} résultat(s)`}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setRows(null)} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}><Text style={styles.link}>Modifier le texte collé</Text></Pressable>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
