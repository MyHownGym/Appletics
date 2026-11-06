// Adresse de la web app (lien envoyé dans les invitations). Modifiable via EXPO_PUBLIC_APP_URL.
export const appUrl = (process.env.EXPO_PUBLIC_APP_URL || 'https://app.appletics.ch').replace(/\/+$/, '');

export const appleticsLinks = {
  app: appUrl,
  website: 'https://www.appletics.ch/',
  instagram: 'https://www.instagram.com/appletics.ch/',
  email: 'mailto:contact@appletics.ch',
  legal: 'https://www.appletics.ch/mentions-legales',
  privacy: 'https://www.appletics.ch/politique-de-confidentialite',
  terms: 'https://www.appletics.ch/conditions-utilisation',
} as const;
