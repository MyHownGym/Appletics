import { useCallback } from 'react';
import { useAuth } from '@/template';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { markManualLock } from '@/services/sessionLock';

// « Se déconnecter » with a confirmation (home screen, sidebar, settings).
export function useLogoutConfirm() {
  const { showAlert } = useLocalizedAlert();
  const auth = useAuth();
  return useCallback(() => {
    showAlert('Se déconnecter ?', 'Vous pourrez vous reconnecter avec votre e-mail et votre mot de passe.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => { markManualLock(); void auth.logout(); } },
    ]);
  }, [showAlert, auth]);
}
