import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useI18n } from '@/hooks/useI18n';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { getInvitationCopy, invitationEmailUrl, invitationSmsUrl, type InvitationOptions } from '@/services/invitationService';

export function useInvitation() {
  const { language } = useI18n();
  const { openLink } = useExternalLinks();
  const { showAlert } = useLocalizedAlert();
  const copy = useMemo(() => getInvitationCopy(language), [language]);
  const sendEmail = useCallback((email: string, options: InvitationOptions = {}) => {
    const url = invitationEmailUrl(email, language, options);
    if (!url) { showAlert('E-mail invalide', 'Veuillez saisir une adresse e-mail valide.'); return; }
    void openLink(url);
  }, [language, openLink, showAlert]);
  const sendSms = useCallback((phone: string, options: InvitationOptions = {}) => {
    const url = invitationSmsUrl(phone, language, Platform.OS, options);
    if (!url) { showAlert('Téléphone invalide', 'Veuillez saisir un numéro de téléphone valide.'); return; }
    void openLink(url);
  }, [language, openLink, showAlert]);
  return { link: copy.link, availability: copy.availability, sendEmail, sendSms };
}
