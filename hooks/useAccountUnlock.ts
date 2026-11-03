import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
export function useAccountUnlock() {
 const auth = useAuth();
 const { user, setLocked } = useApp();
 const [password, setPassword] = useState('');
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const pending = useRef(false);
 const unlock = useCallback(async () => {
  if (pending.current || auth.operationLoading || !password || !user.email) return;
  pending.current = true; setBusy(true); setError('');
  try {
   const result = await auth.signInWithPassword(user.email.trim().toLowerCase(), password);
   if (result.error) { setError(result.error); return; }
   if (!result.user || result.user.id !== user.id) { setError('Ce compte ne correspond pas au profil verrouillé.'); return; }
   setPassword(''); setLocked(false);
  } catch { setError('Connexion impossible. Vérifiez votre connexion.'); }
  finally { pending.current = false; setBusy(false); }
 }, [auth, password, user.id, user.email, setLocked]);
 return { email: user.email, password, setPassword, busy: busy || auth.operationLoading, error, unlock };
}
