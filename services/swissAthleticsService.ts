// Powered by OnSpace.AI
// Swiss Athletics Service — links to official portal (API not accessible from mobile)

export interface FetchedAthleteResult {
  event: string;
  result: string;
  rank: number;
  meetUrl: string;
}

/**
 * Get the Swiss Athletics athlete search URL by name
 */
export function getAthleteSearchUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://www.swiss-athletics.ch/fr/competitions/resultats/classements/?search=${encoded}`;
}

/**
 * Get live results URL
 */
export function getLiveResultsUrl(): string {
  return 'https://www.swiss-athletics.ch/fr/competitions/resultats/live-results/';
}

/**
 * Get online registration URL
 */
export function getInscriptionsUrl(): string {
  return 'https://www.swiss-athletics.ch/fr/competitions/licences-inscription/inscriptions-en-ligne/';
}

/**
 * Get best-list URL for a discipline/category
 */
export function getBestListUrl(discipline?: string, category?: string): string {
  const base =
    'https://www.swiss-athletics.ch/fr/competitions/resultats/listes-des-meilleurs/liste-des-meilleurs-par-discipline-et-categorie/';
  if (!discipline && !category) return base;
  const params = new URLSearchParams();
  if (discipline) params.set('discipline', discipline);
  if (category) params.set('category', category);
  return `${base}?${params.toString()}`;
}

/**
 * Get Swiss Athletics athlete profile URL (la portal)
 */
export function getAthleteProfileUrl(licenseNumber?: string): string {
  if (licenseNumber) {
    return `https://slv.laportal.net/Athletes/Profile/${licenseNumber}`;
  }
  return 'https://slv.laportal.net/Athletes';
}
