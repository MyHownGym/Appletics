import { getSupabaseClient } from '@/template';
import type { Language } from '@/constants/i18n';

// Sends the invitation e-mail from the server (function appletics-send-invite).
// Returns an error message, or '' when the e-mail was sent.
export async function sendInvitationEmail(invitationId: string, language: Language): Promise<string> {
  try {
    const { data, error } = await getSupabaseClient().functions.invoke('appletics-send-invite', { body: { invitationId, language } });
    if (error) {
      const context = (error as { context?: Response }).context;
      const payload = context && typeof context.json === 'function' ? await context.json().catch(() => null) : null;
      return payload?.error || 'L’e-mail n’a pas pu être envoyé.';
    }
    return data?.sent ? '' : (data?.error || 'L’e-mail n’a pas pu être envoyé.');
  } catch {
    return 'L’e-mail n’a pas pu être envoyé.';
  }
}
