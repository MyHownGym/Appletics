import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export function useBiometricSettings() {
  const { user, updateUser } = useApp();
  const biometric = useBiometricAuth();
  const toggle = useCallback(async () => {
    if (biometric.busy || biometric.loading) return;
    if (user.biometricEnabled) { updateUser({ biometricEnabled: false }); return; }
    const result = await biometric.authenticate(false);
    if (result.success) updateUser({ biometricEnabled: true });
  }, [biometric.busy, biometric.loading, biometric.authenticate, user.biometricEnabled, updateUser]);
  const test = useCallback(() => { void biometric.authenticate(false); }, [biometric.authenticate]);
  return { ...biometric, enabled: !!user.biometricEnabled, toggle, test };
}
