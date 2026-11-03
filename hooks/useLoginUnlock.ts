import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export function useLoginUnlock() {
  const { user, setLocked } = useApp();
  const biometric = useBiometricAuth();
  const autoAttempted = useRef(false);
  const focused = useRef(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => listener.remove();
  }, []);
  const requestUnlock = useCallback(async (deviceFallback = false) => {
    const result = await biometric.authenticate(deviceFallback);
    if (result.success && focused.current) setLocked(false);
  }, [biometric.authenticate, setLocked]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    autoAttempted.current = false;
    return () => { focused.current = false; };
  }, []));
  useFocusEffect(useCallback(() => {
    if (!foreground || biometric.loading || !biometric.capabilities.available || !user.biometricEnabled || autoAttempted.current) return;
    const timer = setTimeout(() => {
      if (!focused.current || AppState.currentState !== 'active' || autoAttempted.current) return;
      autoAttempted.current = true;
      void requestUnlock();
    }, 250);
    return () => clearTimeout(timer);
  }, [foreground, biometric.loading, biometric.capabilities.available, user.biometricEnabled, requestUnlock]));
  const continueWithoutBiometrics = useCallback(() => { if (!user.biometricEnabled) setLocked(false); }, [user.biometricEnabled, setLocked]);
  return { user, ...biometric, requestUnlock, continueWithoutBiometrics };
}
