// Reads results copied from the Swiss Athletics website (athlete profile, best lists, result lists)
// and turns each row into { event, result, wind, rank, competition, place, date }.
// Works with tab-separated copies (computer) and one-cell-per-line copies (iPhone).

export interface ParsedSwissResult {
  key: string;
  event: string;
  result: string;
  wind: string;
  rank: number;
  competition: string;
  place: string;
  date: string; // YYYY-MM-DD
}

const DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$|^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,2})?$|^\d{1,3}[.,]\d{2}$/;
const WIND = /^[+\-±]\d{1,2}[.,]\d$|^0[.,]0$/;
const RANK = /^\d{1,3}(\.|[a-z]{1,2}\d{0,2})$/i;

const DISCIPLINES: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/\b(\d)\s*x\s*(100|200|400)\s*m?\b/i, match => `${match[1]}x${match[2]}m Relais`],
  [/\b(60|80|100|110|200|300|400)\s*m\.?\s*(h(ü|ue)rden|haies|hurdles|ostacoli|hs?)\b/i, match => `${match[1]}m Haies`],
  [/\b(3000)\s*m\.?\s*(steeple|hindernis|st)/i, () => '3000m Steeple'],
  [/\b(halbmarathon|semi[- ]?marathon|half marathon|mezza maratona)\b/i, () => 'Semi-marathon'],
  [/\b(marathon|maratona)\b/i, () => 'Marathon'],
  [/\b(cross([- ]?country)?|crosslauf)\b/i, () => 'Cross-country'],
  [/\b20\s*km\b/i, () => '20 km'],
  [/\b(50|60|80|100|150|200|300|400|600|800|1000|1500|2000|3000|5000|10000)\s*m\b/i, match => `${match[1]}m`],
  [/\b(weit(sprung)?|longueur|long jump|salto in lungo|lungo)\b/i, () => 'Saut en longueur'],
  [/\b(drei(sprung)?|triple( saut)?|triple jump|salto triplo)\b/i, () => 'Triple saut'],
  [/\b(hoch(sprung)?|hauteur|high jump|salto in alto)\b/i, () => 'Saut en hauteur'],
  [/\b(stab(hochsprung)?|perche|pole vault|asta)\b/i, () => 'Saut à la perche'],
  [/\b(kugel(stossen)?|poids|shot put|peso)\b/i, () => 'Lancer du poids'],
  [/\b(diskus(wurf)?|disque|discus|disco)\b/i, () => 'Lancer du disque'],
  [/\b(hammer(wurf)?|marteau|martello)\b/i, () => 'Lancer du marteau'],
  [/\b(speer(wurf)?|javelot|javelin|giavellotto)\b/i, () => 'Lancer du javelot'],
  [/\b(ball(wurf)?|balle|vortex)\b/i, () => 'Lancer de balle'],
  [/\b(zehnkampf|décathlon|decathlon)\b/i, () => 'Décathlon'],
  [/\b(siebenkampf|heptathlon)\b/i, () => 'Heptathlon'],
];

export function detectDiscipline(text: string): string | null {
  for (const [pattern, name] of DISCIPLINES) { const match = text.match(pattern); if (match) return name(match); }
  return null;
}

function isoDate(token: string): string | null {
  const match = token.match(DATE);
  if (!match) return null;
  if (match[4]) return `${match[4]}-${match[5]}-${match[6]}`;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  const day = Number(match[1]), month = Number(match[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Performance as written ("10.65", "1:52.34", "7.12"), without hand-timing / altitude marks.
function performanceOf(token: string): string | null {
  const clean = token.replace(/[*()]/g, '').replace(/(m|s|h|a|i|w)$/i, '').replace(',', '.');
  return TIME.test(clean) && !WIND.test(token) ? clean : null;
}

type Cell = { kind: 'date' | 'perf' | 'wind' | 'rank' | 'text' | 'number'; value: string };

function classify(word: string): Cell['kind'] {
  if (isoDate(word)) return 'date';
  if (WIND.test(word.replace(',', '.'))) return 'wind';
  if (performanceOf(word)) return 'perf';
  if (RANK.test(word)) return 'rank';
  if (/^\d+$/.test(word)) return 'number';
  return 'text';
}

const isDisciplineCell = (value: string) => value.length <= 32 && !!detectDiscipline(value);

// One copied cell can hold several values ("10.65 +1.8 3f1 Meeting Genève"): split them, keep text together.
function cellsOf(raw: string): Cell[] {
  const cells: Cell[] = [];
  for (const part of raw.split(/\t| {2,}/).map(item => item.trim()).filter(Boolean)) {
    const words = part.split(/\s+/);
    const plainDiscipline = part.length <= 32 && !!detectDiscipline(part) && !words.some(word => ['date', 'perf', 'wind'].includes(classify(word)));
    if (plainDiscipline || words.every(word => classify(word) === 'text')) { cells.push({ kind: 'text', value: part }); continue; }
    let text: string[] = [];
    const flush = () => { if (text.length) { cells.push({ kind: 'text', value: text.join(' ') }); text = []; } };
    for (const word of words) {
      const kind = classify(word);
      if (kind === 'text') text.push(word); else { flush(); cells.push({ kind, value: word }); }
    }
    flush();
  }
  return cells;
}


function toRow(row: Cell[], currentEvent: string): ParsedSwissResult | null {
  const dateIndex = row.findIndex(cell => cell.kind === 'date');
  const perfIndex = row.findIndex(cell => cell.kind === 'perf');
  if (dateIndex < 0 || perfIndex < 0) return null;
  const texts = row.filter(cell => cell.kind === 'text').map(cell => cell.value);
  const disciplineText = texts.find(isDisciplineCell);
  const event = disciplineText ? detectDiscipline(disciplineText)! : currentEvent;
  if (!event) return null;
  const others = texts.filter(value => value !== disciplineText && /[a-zà-ÿ]{2,}/i.test(value));
  const after = row.slice(perfIndex + 1);
  const rankCell = after.find(cell => cell.kind === 'rank') ?? after.find(cell => cell.kind === 'number' && Number(cell.value) < 100);
  const date = isoDate(row[dateIndex].value)!;
  const result = performanceOf(row[perfIndex].value)!;
  const rawWind = after.slice(0, 3).find(cell => cell.kind === 'wind')?.value.replace(',', '.').replace('±', '+') ?? '';
  const wind = rawWind && !/^[+-]/.test(rawWind) ? `+${rawWind}` : rawWind;
  return { key: `${date}|${event}|${result}`, event, result, wind, rank: rankCell ? parseInt(rankCell.value, 10) || 0 : 0, competition: others[0] ?? '', place: others[1] ?? '', date };
}

export function parseSwissResults(input: string, fallbackEvent = ''): ParsedSwissResult[] {
  const rows: ParsedSwissResult[] = [];
  let currentEvent = fallbackEvent;
  let buffer: Cell[] = [];
  const flush = () => { const row = toRow(buffer, currentEvent); if (row) rows.push(row); buffer = []; };
  for (const line of input.replace(/\r/g, '').split('\n')) {
    const cells = cellsOf(line);
    if (!cells.length) continue;
    const hasDate = cells.some(cell => cell.kind === 'date'), hasPerf = cells.some(cell => cell.kind === 'perf');
    // A heading such as "100 m" or "Weitsprung" (no performance, no date) starts a discipline block.
    if (!hasDate && !hasPerf && cells.length <= 3 && cells.some(cell => cell.kind === 'text' && isDisciplineCell(cell.value))) {
      flush();
      currentEvent = detectDiscipline(cells.find(cell => cell.kind === 'text' && isDisciplineCell(cell.value))!.value) ?? currentEvent;
      continue;
    }
    // A whole row on one line (copy from a computer): read it on its own, whatever the column order.
    if (hasDate && hasPerf) { flush(); buffer = cells; flush(); continue; }
    // One cell per line (copy from an iPhone): a row ends where the next row's date or performance begins.
    for (const cell of cells) {
      const hasBoth = buffer.some(item => item.kind === 'date') && buffer.some(item => item.kind === 'perf');
      if (hasBoth && (cell.kind === 'date' || cell.kind === 'perf')) flush();
      buffer.push(cell);
      if (buffer.length > 40) buffer = buffer.slice(-20);
    }
  }
  flush();
  // Same row copied twice: once.
  return rows.filter((row, index) => rows.findIndex(other => other.key === row.key) === index);
}
