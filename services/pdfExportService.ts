import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TrainingPlan, Competition, CompResult, Athlete } from '@/types';
import { Language } from '@/constants/i18n';
import { getCompetitionPresentation } from '@/services/competitionPresentationService';
import { translateUiText, localeFor, weekdayLabel } from '@/services/localizationService';
const css = `body{font-family:Arial,sans-serif;margin:24px;color:#0F172A}h1{font-size:22px;color:#FF5722}h2{font-size:18px;margin-top:24px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #EAEDF2;font-size:13px;line-height:1.6}th{background:#FFF3EE;color:#A33212}.brand{background:#FF5722;color:white;border-radius:8px;padding:8px 12px;display:inline-block;font-weight:bold}.meta,footer{font-size:12px;color:#475569}footer{margin-top:32px;text-align:center}.pb{color:#166534;font-weight:bold}`;
const escape = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function translator(language: Language) { return (text: string) => escape(translateUiText(text, language)); }
function table(headings: string[], rows: string[][], language: Language): string {
  const t = translator(language);
  return `<table><thead><tr>${headings.map(label => `<th>${t(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function documentHtml(title: string, subtitle: string, content: string, language: Language): string {
  const t = translator(language);
  return `<!DOCTYPE html><html lang="${language}"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="brand">AP</div><h1>${escape(title)}</h1><p class="meta">${escape(subtitle)} · ${t('Exporté le')} ${escape(new Date().toLocaleDateString(localeFor(language), { day: 'numeric', month: 'long', year: 'numeric' }))}</p>${content}<footer>Appletics · appletics.ch</footer></body></html>`;
}
async function printAndShare(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
  else await Print.printAsync({ uri });
}
export async function exportTrainingPlan(plan: TrainingPlan, athletes: Athlete[], language: Language = 'fr'): Promise<void> {
  const t = translator(language);
  const assigned = athletes.filter(athlete => plan.athleteIds.includes(athlete.id));
  const info = table(['Informations générales', 'Détails'], [
    [t('Phase'), t(plan.phase)], [t('Groupe'), t(plan.group)], [t('Durée'), `${plan.weeks} ${t('semaines')} (${escape(plan.startDate)} → ${escape(plan.endDate)})`],
    [t('Athlètes'), assigned.length ? assigned.map(athlete => escape(athlete.name)).join(', ') : t('Aucun athlète assigné')],
  ], language);
  const sessions = table(['Jour', 'Séance', 'Intensité', 'Durée', 'Détails'], plan.sessions.map(session => [
    escape(weekdayLabel(session.day, language)), escape(session.title), t(session.intensity), session.duration > 0 ? `${session.duration} min` : '—', escape(session.details),
  ]), language);
  const content = `${info}${plan.description ? `<p>${escape(plan.description)}</p>` : ''}<h2>${t('Sessions de la semaine type')}</h2>${sessions}`;
  await printAndShare(documentHtml(plan.title, `${translateUiText(plan.phase, language)} · ${plan.weeks} ${translateUiText('semaines', language)} · ${translateUiText(plan.group, language)}`, content, language), `Appletics_Plan_${plan.title}.pdf`);
}
export async function exportCompetitionResults(competition: Competition, results: CompResult[], athletes: Athlete[], language: Language = 'fr'): Promise<void> {
  const t = translator(language);
  const presentation = getCompetitionPresentation(competition, language);
  const entries = results.filter(result => result.competitionId === competition.id);
  const info = table(['Informations générales', 'Détails'], [
    [t('Date'), escape(competition.date)], [t('Lieu'), escape(presentation.venueLabel)], [t('Type'), escape(presentation.typeLabel)], [t('Statut'), escape(presentation.statusLabel)],
    ...(competition.teamScore !== undefined ? [[t('Score équipe'), `${competition.teamScore} pts${competition.teamRank ? ` · #${competition.teamRank}` : ''}`]] : []),
  ], language);
  const rows = entries.map(result => [escape(athletes.find(athlete => athlete.id === result.athleteId)?.name ?? translateUiText('Inconnu', language)), escape(result.event), result.rank > 0 ? `#${result.rank}` : '—', `<span class="${result.pb ? 'pb' : ''}">${escape(result.result)}${result.pb ? ' PB' : ''}</span>`, escape(result.notes ?? '—')]);
  const content = `${info}<h2>${t('Résultats des athlètes')}</h2>${rows.length ? table(['Athlète', 'Épreuve', 'Rang', 'Résultat', 'Notes'], rows, language) : `<p>${t('Aucun résultat enregistré')}</p>`}`;
  await printAndShare(documentHtml(competition.name, `${competition.date} · ${presentation.venueLabel}`, content, language), `Appletics_Competition_${competition.name}.pdf`);
}
export async function exportAthleteProfile(athlete: Athlete, results: CompResult[], competitions: Competition[], language: Language = 'fr'): Promise<void> {
  const t = translator(language);
  const pbs = Object.entries(athlete.pb ?? {}).map(([event, performance]) => [escape(event), escape(performance), 'PB']);
  const entries = results.filter(result => result.athleteId === athlete.id).map(result => {
    const competition = competitions.find(item => item.id === result.competitionId);
    return [escape(competition?.name ?? '—'), escape(competition?.date ?? ''), escape(result.event), result.rank > 0 ? `#${result.rank}` : '—', `${escape(result.result)}${result.pb ? ' PB' : ''}`];
  });
  const content = `${table(['Informations générales', 'Détails'], [[t('Épreuves'), escape(athlete.events.join(', '))], [t('Groupe'), t(athlete.group)], [t('Statut'), t(athlete.status)]], language)}<h2>${t('Records personnels')}</h2>${pbs.length ? table(['Épreuve', 'Performance', 'PB'], pbs, language) : `<p>${t('Aucun record enregistré')}</p>`}<h2>${t('Historique des résultats')}</h2>${entries.length ? table(['Compétition', 'Date', 'Épreuve', 'Rang', 'Résultat'], entries, language) : `<p>${t('Aucun résultat')}</p>`}`;
  await printAndShare(documentHtml(athlete.name, `${translateUiText(athlete.group, language)} · ${athlete.events.join(', ')}`, content, language), `Appletics_Athlete_${athlete.name}.pdf`);
}
export async function exportSquadOverview(athletes: Athlete[], coachName: string, clubName: string, language: Language = 'fr'): Promise<void> {
  const t = translator(language);
  const groups = [...new Set(athletes.map(athlete => athlete.group))];
  const content = groups.map(group => `<h2>${t(group)}</h2>${table(['Athlète', 'Épreuves', 'Statut', 'Records (extrait)'], athletes.filter(athlete => athlete.group === group).map(athlete => [escape(athlete.name), escape(athlete.events.join(', ')), t(athlete.status), escape(Object.entries(athlete.pb).map(([event, performance]) => `${event}: ${performance}`).join(' · '))]), language)}`).join('');
  await printAndShare(documentHtml(clubName, `${translateUiText('Coach', language)}: ${coachName} · ${athletes.length} ${translateUiText('Athlètes', language)}`, content, language), `Appletics_Squad_${clubName}.pdf`);
}
