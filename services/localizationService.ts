import { Language, translations } from '@/constants/i18n';
import { uiTranslations, uiTemplates } from '@/constants/uiTranslations';
import { supplementalCopy, supplementalTemplates } from '@/constants/localizationSupplement';
import { billingTranslations, billingTemplates } from '@/constants/billingTranslations';
import { collaborationTranslations } from '@/constants/collaborationTranslations';
import { betaTranslations } from '@/constants/betaTranslations';
export const supportedLanguages: readonly Language[] = ['fr', 'de', 'it'];
export function normalizeLanguage(value: string | null | undefined): Language {
  const code = (value ?? '').toLowerCase().split(/[-_]/)[0];
  return code === 'de' || code === 'it' ? code : 'fr';
}
export function localeFor(language: Language): string { return `${language}-CH`; }
const normalize = (value: string) => value.trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
const dictionaries = new Map<Language, Map<string, string>>();
function dictionary(language: Language): Map<string, string> {
  const existing = dictionaries.get(language);
  if (existing) return existing;
  const result = new Map<string, string>();
  for (const key of Object.keys(translations.fr)) result.set(normalize((translations.fr as Record<string, string>)[key]), (translations[language] as Record<string, string>)[key]);
  const column = language === 'de' ? 1 : language === 'it' ? 2 : 0;
  for (const row of [...uiTranslations, ...supplementalCopy, ...billingTranslations, ...collaborationTranslations, ...betaTranslations]) result.set(normalize(row[0]), row[column]);
  const aliases: Record<string, string> = { sprints: 'group_sprints', distance: 'group_distance', middle_distance: 'group_distance', hurdles: 'group_hurdles', jumps: 'group_jumps', throws: 'group_throws', relay: 'group_relay', field: 'field', easy: 'intensity_easy', moderate: 'intensity_moderate', hard: 'intensity_hard', race: 'intensity_race', rest: 'intensity_rest', active: 'active', injured: 'injured', inactive: 'inactive' };
  for (const [source, key] of Object.entries(aliases)) result.set(source, (translations[language] as Record<string, string>)[key]);
  const phases: Record<string, string> = { Build: 'Développement', Peak: 'Pic de forme', Taper: 'Affûtage', Recovery: 'Récupération', Competition: 'Compétition' };
  for (const [source, label] of Object.entries(phases)) result.set(source, result.get(normalize(label)) ?? label);
  dictionaries.set(language, result);
  return result;
}
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [...uiTemplates, ...supplementalTemplates, ...billingTemplates].map(row => {
  const names: string[] = [];
  const parts = normalize(row[0]).split(/(\{\w+\})/g);
  const pattern = parts.map(part => {
    if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return '(.+?)'; }
    return escapePattern(part);
  }).join('');
  return { row, names, matcher: new RegExp(`^${pattern}$`) };
});
// Deterministic UI catalogues only. Never changes stored/user-entered data.
export function translateUiText(value: string, language: Language): string {
  const input = normalize(value);
  if (!input) return value;
  const byKey = (translations[language] as Record<string, string>)[value];
  if (byKey) return byKey;
  const map = dictionary(language);
  let translated = map.get(input);
  const price = /^CHF\s+([\d.,]+)(\/mois|\/an)$/.exec(input);
  if (translated === undefined && price) translated = `CHF ${price[1]}${map.get(price[2]) ?? price[2]}`;
  if (translated === undefined) {
    for (const pattern of patterns) {
      const match = pattern.matcher.exec(input);
      if (!match) continue;
      const column = language === 'de' ? 1 : language === 'it' ? 2 : 0;
      translated = pattern.row[column].replace(/\{(\w+)\}/g, (_, key: string) => {
        const capture = match[pattern.names.indexOf(key) + 1] ?? '';
        // Names, groups, numerical results and monetary amounts are preserved.
        return key === 'day' ? weekdayLabel(capture, language) : ['season', 'verb', 'method'].includes(key) ? translateUiText(capture, language) : capture;
      });
      break;
    }
  }
  if (translated === undefined && / · | — /.test(input)) {
    const parts = input.split(/( · | — )/);
    const localized = parts.map(part => /^ · $|^ — $/.test(part) ? part : translateUiText(part, language));
    if (localized.some((part, index) => part !== parts[index])) translated = localized.join('');
  }
  return translated === undefined ? value : `${value.match(/^\s*/)?.[0] ?? ''}${translated}${value.match(/\s*$/)?.[0] ?? ''}`;
}
export function weekdayLabel(day: string, language: Language): string {
  const aliases = [['Mon', 'Lun'], ['Tue', 'Mar'], ['Wed', 'Mer'], ['Thu', 'Jeu'], ['Fri', 'Ven'], ['Sat', 'Sam'], ['Sun', 'Dim']];
  const index = aliases.findIndex(keys => keys.includes(day));
  const keys = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
  return index < 0 ? day : (translations[language] as Record<string, string>)[keys[index]];
}
