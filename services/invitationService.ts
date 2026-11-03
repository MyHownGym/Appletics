import { appleticsLinks } from '@/constants/links';
import type { Language } from '@/constants/i18n';

export interface InvitationOptions { name?: string; groupName?: string; role?: 'coach' | 'athlete' }
const copy = {
  fr: {
    subject: 'Invitation Appletics', greeting: 'Bonjour', invitation: 'Vous êtes invité(e) à rejoindre Appletics.',
    website: 'Site officiel', store: 'Le lien App Store sera disponible après publication.',
    group: 'Groupe', coach: 'Coach', athlete: 'Athlète', role: 'Rôle',
    accept: 'Connectez-vous dans Appletics avec cette adresse e-mail, puis acceptez l’invitation dans Profil > Groupes partagés.',
  },
  de: {
    subject: 'Appletics-Einladung', greeting: 'Hallo', invitation: 'Sie sind eingeladen, Appletics beizutreten.',
    website: 'Offizielle Website', store: 'Der App-Store-Link ist nach der Veröffentlichung verfügbar.',
    group: 'Gruppe', coach: 'Trainer', athlete: 'Athlet', role: 'Rolle',
    accept: 'Melden Sie sich in Appletics mit dieser E-Mail-Adresse an und nehmen Sie die Einladung unter Profil > Gemeinsame Gruppen an.',
  },
  it: {
    subject: 'Invito Appletics', greeting: 'Ciao', invitation: 'Sei invitato a unirti ad Appletics.',
    website: 'Sito ufficiale', store: 'Il link App Store sarà disponibile dopo la pubblicazione.',
    group: 'Gruppo', coach: 'Allenatore', athlete: 'Atleta', role: 'Ruolo',
    accept: 'Accedi ad Appletics con questo indirizzo email, poi accetta l’invito in Profilo > Gruppi condivisi.',
  },
} as const;

export function getInvitationCopy(language: Language, options: InvitationOptions = {}) {
  const text = copy[language] ?? copy.fr;
  const name = options.name?.trim() ?? '';
  const groupName = options.groupName?.trim() ?? '';
  const greeting = `${text.greeting}${name ? ` ${name}` : ''},`;
  const details = groupName ? `${text.group} : ${groupName}${options.role ? `\n${text.role} : ${options.role === 'coach' ? text.coach : text.athlete}` : ''}\n\n${text.accept}` : '';
  return {
    link: appleticsLinks.website, subject: text.subject, availability: text.store,
    emailBody: [greeting, text.invitation, details, `${text.website} : ${appleticsLinks.website}`, text.store].filter(Boolean).join('\n\n'),
    smsBody: [text.subject, name, text.invitation, groupName ? `${text.group} : ${groupName}. ${text.accept}` : '', appleticsLinks.website, text.store].filter(Boolean).join(' — '),
  };
}

export function invitationEmailUrl(email: string, language: Language, options: InvitationOptions = {}): string | null {
  const recipient = email.trim();
  if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(recipient)) return null;
  const text = getInvitationCopy(language, options);
  return `mailto:${recipient}?subject=${encodeURIComponent(text.subject)}&body=${encodeURIComponent(text.emailBody)}`;
}

export function invitationSmsUrl(phone: string, language: Language, platform: string, options: InvitationOptions = {}): string | null {
  const recipient = phone.trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d{6,15}$/.test(recipient)) return null;
  const text = getInvitationCopy(language, options);
  // Apple's Messages expects &body; Android uses ?body.
  return `sms:${recipient}${platform === 'ios' ? '&' : '?'}body=${encodeURIComponent(text.smsBody)}`;
}
