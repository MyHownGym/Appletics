import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/template';

export function useAccountDeletion(visible: boolean, onClose: () => void) {
  const { deleteAccount } = useApp();
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!visible) { setPassword(''); setAccepted(false); setError(''); } }, [visible]);
  const erase = useCallback(async () => {
    if (pending.current || auth.operationLoading || !accepted || !password) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await deleteAccount(password);
      if (mounted.current) { setPassword(''); onClose(); }
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'Suppression impossible. Réessayez.');
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  }, [deleteAccount, accepted, password, auth.operationLoading, onClose]);
  return { password, setPassword, accepted, setAccepted, busy: busy || auth.operationLoading, error, erase };
}
