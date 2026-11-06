export function normalizeWebUrl(value: string): string | null {
  const url = value.trim();
  if (!/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(url)) return null;
  if (/^https?:\/\/(?:www\.)?appletics\.ch(?:\/|$)/i.test(url)) {
    return url.replace(/^https?:\/\/(?:www\.)?appletics\.ch/i, 'https://www.appletics.ch') + (url.endsWith('.ch') ? '/' : '');
  }
  return url;
}
export function getLinkHost(url: string): string {
  return url.split('://')[1]?.split('/')[0]?.split('?')[0] || 'Lien';
}
export function isSystemLink(url: string): boolean {
  return /^(mailto:|sms:|tel:)/i.test(url) && !/[\r\n]/.test(url);
}
