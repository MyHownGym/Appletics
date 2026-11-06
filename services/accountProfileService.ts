import { getSupabaseClient } from '@/template';
import type { User } from '@/types';
import { withStartupDeadline } from '@/services/startupService';

export async function loadAccountProfile(id: string): Promise<Partial<User> | null> {
  const controller = new AbortController();
  try {
    const { data, error } = await withStartupDeadline(
      getSupabaseClient().from('user_profiles').select('appletics_profile').eq('id', id).abortSignal(controller.signal).maybeSingle(),
      'Le profil ne répond pas. Vérifiez votre connexion, puis réessayez. Votre historique local est conservé.',
    );
    if (error) throw new Error('Impossible de charger votre profil sécurisé. Vérifiez votre connexion, puis réessayez.');
    const profile = data?.appletics_profile;
    return profile && typeof profile === 'object' && typeof profile.firstName === 'string' && profile.firstName.trim() ? profile : null;
  } finally { controller.abort(); }
}
export async function saveAccountProfile(profile: User): Promise<void> {
  if (!profile.firstName?.trim()) throw new Error('Le prénom est obligatoire.');
  // Never persist credentials, PINs or device-specific biometric preferences in the cloud.
  const { pin: _pin, biometricEnabled: _biometric, ...publicProfile } = profile;
  const avatar = publicProfile.avatar;
  if (avatar && !/^https:\/\//.test(avatar)) publicProfile.avatar = null;
  const { data, error } = await getSupabaseClient().from('user_profiles').update({ appletics_profile: publicProfile }).eq('id', profile.id).select('id').maybeSingle();
  if (error || !data) throw new Error('Impossible de sauvegarder le profil. Réessayez.');
}
