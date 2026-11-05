import { useEffect, useState } from 'react';
import { prepareAuthSessionDispatch } from '@/services/authStartupService';
import { useStartup } from '@/hooks/useStartup';

export function useAuthStartup() {
  const [prepared, setPrepared] = useState(false);
  const { report, attempt } = useStartup();
  useEffect(() => {
    try {
      prepareAuthSessionDispatch();
      setPrepared(true);
    } catch {
      report('provider', 'Impossible d’initialiser la connexion sécurisée. Réessayez sans supprimer l’app.');
    }
  }, [report, attempt]);
  return { prepared };
}
