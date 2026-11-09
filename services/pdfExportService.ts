import { Platform } from 'react-native';
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
// Web (browser / iPhone home-screen app): expo-print cannot build a file there. The document is shown
// full screen inside the app (no pop-up, works in the installed app) with a button that opens the
// system print sheet, where « Enregistrer en PDF » / « Partager » is offered.
function printOnWeb(html: string, filename: string) {
  document.getElementById('appletics-print')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'appletics-print';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;flex-direction:column';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) 12px 10px;border-bottom:1px solid #EAEDF2;background:#fff';
  const title = document.createElement('div');
  title.textContent = filename.replace(/\.pdf$/i, '').replace(/_/g, ' ');
  title.style.cssText = 'flex:1;font:600 15px -apple-system,Arial;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const button = (label: string, primary: boolean) => {
    const element = document.createElement('button');
    element.textContent = label;
    element.style.cssText = `font:600 15px -apple-system,Arial;padding:11px 16px;border-radius:10px;border:${primary ? '0' : '1px solid #EAEDF2'};background:${primary ? '#FF5722' : '#fff'};color:${primary ? '#fff' : '#0F172A'}`;
    return element;
  };
  const save = button('Enregistrer en PDF', true), close = button('Fermer', false);
  const frame = document.createElement('iframe');
  frame.title = title.textContent;
  frame.style.cssText = 'flex:1;width:100%;border:0;background:#fff';
  frame.srcdoc = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
  save.onclick = () => { try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.print(); } };
  close.onclick = () => overlay.remove();
  bar.append(title, save, close);
  overlay.append(bar, frame);
  document.body.appendChild(overlay);
}
async function printAndShare(html: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') { printOnWeb(html, filename); return; }
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
