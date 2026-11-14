import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TrainingPlan, Competition, CompResult, Athlete } from '@/types';
import { Language } from '@/constants/i18n';
import { getCompetitionPresentation } from '@/services/competitionPresentationService';
import { translateUiText, localeFor, weekdayLabel } from '@/services/localizationService';
import { PDF_LOGO } from '@/constants/pdfLogo';
const css = `body{font-family:Arial,sans-serif;margin:24px;color:#0F172A}h1{font-size:22px;color:#FF5722}h2{font-size:18px;margin-top:24px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #EAEDF2;font-size:13px;line-height:1.6}th{background:#FFF3EE;color:#A33212}.brand{display:flex;align-items:center;gap:10px;margin-bottom:6px}.brand img{width:44px;height:44px;border-radius:10px}.brand span{font-weight:800;font-size:18px;letter-spacing:1px;color:#FF5722}.meta,footer{font-size:12px;color:#475569}footer{margin-top:32px;text-align:center}.pb{color:#166534;font-weight:bold}`;
const escape = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function translator(language: Language) { return (text: string) => escape(translateUiText(text, language)); }
function table(headings: string[], rows: string[][], language: Language): string {
  const t = translator(language);
  return `<table><thead><tr>${headings.map(label => `<th>${t(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function documentHtml(title: string, subtitle: string, content: string, language: Language): string {
  const t = translator(language);
  return `<!DOCTYPE html><html lang="${language}"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="brand"><img src="${PDF_LOGO}" alt="Appletics"><span>APPLETICS</span></div><h1>${escape(title)}</h1><p class="meta">${escape(subtitle)} · ${t('Exporté le')} ${escape(new Date().toLocaleDateString(localeFor(language), { day: 'numeric', month: 'long', year: 'numeric' }))}</p>${content}<footer>Appletics · appletics.ch</footer></body></html>`;
}
// Web (browser / iPhone home-screen app): the system print sheet does not open from an installed
// iPhone app, so the PDF file is built in the page (html2canvas + jsPDF) while the preview shows,
// then handed to the share sheet (« Enregistrer dans Fichiers », AirDrop, Mail…) or downloaded.
// Loaded on demand from cdnjs (not bundled: jsPDF breaks the static web build).
const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const tag = document.createElement('script');
  tag.src = src; tag.async = true; tag.crossOrigin = 'anonymous';
  tag.onload = () => resolve(); tag.onerror = () => reject(new Error(`load ${src}`));
  document.head.appendChild(tag);
});
type PdfLibs = { html2canvas: (element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLCanvasElement>; jsPDF: any };
async function pdfLibs(): Promise<PdfLibs> {
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'),
  ]);
  const scope = window as unknown as { html2canvas: PdfLibs['html2canvas']; jspdf: { jsPDF: any } };
  return { html2canvas: scope.html2canvas, jsPDF: scope.jspdf.jsPDF };
}
async function buildPdfBlob(html: string): Promise<Blob> {
  const { html2canvas, jsPDF } = await pdfLibs();
  // Laid out off screen at A4 width (794 px), whatever the phone width.
  const sheet = document.createElement('iframe');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden';
  document.body.appendChild(sheet);
  try {
    await new Promise<void>(resolve => { sheet.onload = () => resolve(); sheet.srcdoc = html; });
    const doc = sheet.contentDocument;
    if (!doc?.body) throw new Error('sheet not ready');
    await Promise.all(Array.from(doc.images).map(image => image.complete ? null : new Promise(done => { image.onload = image.onerror = done; })));
    const canvas = await html2canvas(doc.body, { scale: 2, backgroundColor: '#ffffff', windowWidth: 794 });
    return toPdf(canvas, jsPDF);
  } finally { sheet.remove(); }
}
function toPdf(canvas: HTMLCanvasElement, jsPDF: any): Blob {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight();
  const sliceHeight = Math.floor(canvas.width * (pageHeight / pageWidth));
  for (let top = 0, page = 0; top < canvas.height; top += sliceHeight, page++) {
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = Math.min(sliceHeight, canvas.height - top);
    slice.getContext('2d')?.drawImage(canvas, 0, top, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, slice.height * (pageWidth / canvas.width));
  }
  return pdf.output('blob');
}
function saveBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    nav.share({ files: [file], title: filename }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.rel = 'noopener';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function printOnWeb(html: string, filename: string) {
  document.getElementById('appletics-print')?.remove();
  const safeName = filename.replace(/[\\/:*?"<>|]+/g, '-');
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
  const save = button('Préparation…', true), close = button('Fermer', false);
  save.disabled = true; save.style.opacity = '0.6';
  const frame = document.createElement('iframe');
  frame.title = title.textContent;
  frame.style.cssText = 'flex:1;width:100%;border:0;background:#fff';
  frame.srcdoc = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
  // Built ahead of the tap: the share sheet only opens straight from a tap, not after a long wait.
  let ready: Blob | null = null;
  {
    buildPdfBlob(html).then(blob => {
      ready = blob; save.textContent = 'Enregistrer en PDF'; save.disabled = false; save.style.opacity = '1';
    }).catch(() => {
      save.textContent = 'Imprimer / PDF'; save.disabled = false; save.style.opacity = '1';
    });
  }
  save.onclick = () => {
    if (ready) { saveBlob(ready, safeName); return; }
    try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.print(); }
  };
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
