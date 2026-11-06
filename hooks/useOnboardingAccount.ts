import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { loadAccountProfile, saveAccountProfile } from '@/services/accountProfileService';
import type { User } from '@/types';
export function useOnboardingAccount(profile: Partial<User>, onComplete: () => void, onExistingAccount?: () => void) {
 const auth = useAuth();
 const { updateUser } = useApp();
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const pending = useRef(false);
 const complete = useCallback(async () => {
  if (!auth.user || auth.loading || auth.operationLoading || pending.current) return;
  if (!profile.firstName?.trim()) { setError('Le prénom est obligatoire.'); return; }
  pending.current = true; setBusy(true); setError('');
  try {
   // Existing account (signed in rather than created): keep its saved profile, skip the introduction.
   const existing = onExistingAccount ? await loadAccountProfile(auth.user.id).catch(() => null) : null;
   if (existing) { onExistingAccount?.(); return; }
   const next: User = { id: auth.user.id, email: auth.user.email, name: [profile.firstName.trim(), profile.lastName?.trim()].filter(Boolean).join(' '), role: 'Athlete', club: '', avatar: null, ...profile };
   // Identity and login email can never be overridden by a local draft.
   next.id = auth.user.id; next.email = auth.user.email;
   await saveAccountProfile(next);
   updateUser(next);
   onComplete();
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de sauvegarder le profil. Réessayez.'); }
  finally { setBusy(false); pending.current = false; }
 }, [auth.user, auth.loading, auth.operationLoading, profile, updateUser, onComplete, onExistingAccount]);
 return { authenticated: !!auth.user, loading: auth.loading, busy: busy || auth.operationLoading, error, complete };
}
