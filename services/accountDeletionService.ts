import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/template';

export async function eraseCloudAccount(password: string): Promise<void> {
  const client = getSupabaseClient();
  const { data: session, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session.session) throw new Error('Reconnectez-vous avant de supprimer votre compte.');
  const { data, error } = await client.functions.invoke('appletics-delete-account', {
    headers: { Authorization: `Bearer ${session.session.access_token}` },
    body: { password, confirmation: 'DELETE_APPLETICS' },
  });
  if (error) {
    let message = 'La suppression Cloud a échoué. Réessayez ; votre historique local reste conservé.';
    if (error instanceof FunctionsHttpError) {
      try {
        const text = await error.context.text();
        const response = JSON.parse(text);
        if (typeof response.error === 'string') message = response.error;
      } catch { /* Never display an untrusted HTML response or sensitive server diagnostics. */ }
    }
    throw new Error(message);
  }
  if (!data?.deleted) throw new Error('La suppression du compte n’a pas été confirmée. Réessayez.');
}

export async function clearDeletedAccountSession(): Promise<void> {
  // The remote account is already irreversibly removed. Local sign-out must not depend on its revoked JWT.
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
  if (error) throw new Error('Compte supprimé. Fermez et rouvrez l’app pour terminer la déconnexion locale.');
}
