import { getSupabaseClient } from '@/template';
import { useCallback, useState, useRef } from 'react';
import { useAuth } from '@/template';
export function useBillingAccount(initialRegister = false, onSignedIn?: (userId: string) => void) {
  const auth = useAuth();
  const [register, setRegister] = useState(initialRegister);
  // Forgotten password: code by e-mail, then a new password for the existing account.
  const [reset, setReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toggleMode = useCallback(() => { setRegister(value => !value); setReset(false); setCodeSent(false); setOtp(''); setError(''); setMessage(''); }, []);
  const startReset = useCallback(() => { setReset(true); setRegister(false); setCodeSent(false); setOtp(''); setPassword(''); setConfirmation(''); setError(''); setMessage(''); }, []);
  const cancelReset = useCallback(() => { setReset(false); setCodeSent(false); setOtp(''); setPassword(''); setConfirmation(''); setError(''); setMessage(''); }, []);
  const submit = useCallback(async () => {
    if (pending.current || busy || auth.operationLoading) return;
    setError(''); setMessage('');
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) { setError('Vérifiez votre adresse e-mail.'); return; }
    if (reset) {
      pending.current = true; setBusy(true);
      try {
        if (!codeSent) {
          const sent = await auth.sendOTP(normalized, { shouldCreateUser: false });
          if (sent.error) { setError(/signup|not allowed|not found/i.test(sent.error) ? 'Aucun compte n’est associé à cet e-mail.' : sent.error); return; }
          setCodeSent(true); setMessage('Code envoyé par e-mail. Saisissez-le avec votre nouveau mot de passe.'); return;
        }
        if (!/^\d{4,8}$/.test(otp)) { setError('Saisissez le code reçu par e-mail.'); return; }
        if (password.length < 6) { setError('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return; }
        if (password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
        const result = await auth.verifyOTPAndLogin(normalized, otp, { password });
        if (result.error) { setError(/expired|invalid/i.test(result.error) ? 'Code incorrect ou expiré. Demandez un nouveau code.' : result.error); return; }
        if (!result.user) { setError('Connexion non confirmée. Réessayez.'); return; }
        setPassword(''); setConfirmation(''); setOtp(''); setCodeSent(false); setReset(false); setMessage('Mot de passe modifié. Vous êtes connecté.');
        onSignedIn?.(result.user.id);
      } catch { setError('Opération impossible. Vérifiez votre connexion.'); }
      finally { setBusy(false); pending.current = false; }
      return;
    }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (register && password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (register && codeSent && !/^\d{4,8}$/.test(otp)) { setError('Saisissez le code reçu par e-mail.'); return; }
    pending.current = true; setBusy(true);
    try {
      if (register && !codeSent) {
        // One account per e-mail: an existing address must sign in, not register again
        // (registering again would replace that account's password).
        const { data: exists, error: lookupError } = await getSupabaseClient().rpc('appletics_email_registered', { p_email: normalized });
        if (!lookupError && exists === true) { setError('Un compte est déjà associé à cet e-mail. Connectez-vous avec votre mot de passe.'); setRegister(false); setConfirmation(''); return; }
        const result = await auth.sendOTP(normalized);
        if (result.error) { setError(result.error); return; }
        setCodeSent(true); setMessage('Code de vérification envoyé par e-mail.'); return;
      }
      const result = register
        ? await auth.verifyOTPAndLogin(normalized, otp, { password })
        : await auth.signInWithPassword(normalized, password);
      if (result.error) { setError(result.error); return; }
      if (!result.user) { setError('Connexion non confirmée. Réessayez.'); return; }
      setPassword(''); setConfirmation(''); setOtp(''); setCodeSent(false); setMessage('Compte connecté.');
      onSignedIn?.(result.user.id);
      // AuthProvider and AuthRouter own session restoration and navigation; no manual redirect here.
    } catch { setError('Connexion impossible. Vérifiez votre connexion.'); }
    finally { setBusy(false); pending.current = false; }
  }, [auth, busy, email, password, confirmation, otp, register, reset, codeSent, onSignedIn]);
  const logout = useCallback(async () => {
    if (auth.operationLoading || busy) return;
    setBusy(true); setError('');
    try { const result = await auth.logout(); if (result.error) setError(result.error); }
    catch { setError('Déconnexion impossible. Réessayez.'); }
    finally { setBusy(false); }
  }, [auth, busy]);
  return { user: auth.user, loading: auth.loading, busy: busy || auth.operationLoading, register, reset, startReset, cancelReset, email, setEmail, password, setPassword, confirmation, setConfirmation, otp, setOtp, codeSent, error, message, toggleMode, submit, logout };
}
