import { getSupabaseClient } from '@/template';
import type { Language } from '@/constants/i18n';

// Sends the invitation e-mail from the server (function appletics-send-invite).
// Returns an error message explaining the cause, or '' when the e-mail was sent.
export async function sendInvitationEmail(invitationId: string, language: Language): Promise<string> {
  try {
    const { data, error } = await getSupabaseClient().functions.invoke('appletics-send-invite', { body: { invitationId, language } });
    if (error) {
      const context = (error as { context?: Response }).context;
      const status = context && typeof context.status === 'number' ? context.status : 0;
      const payload = context && typeof context.json === 'function' ? await context.clone().json().catch(() => null) : null;
      if (payload?.error) return payload.error;
      if (status === 404) return 'la fonction d’envoi « appletics-send-invite » n’est pas installée sur le serveur';
      if (status === 401) return 'session expirée, reconnectez-vous';
      if (!status) return 'serveur d’envoi injoignable';
      return `erreur du serveur d’envoi (${status})`;
    }
    return data?.sent ? '' : (data?.error || 'réponse inattendue du serveur d’envoi');
  } catch {
    return 'serveur d’envoi injoignable';
  }
}
