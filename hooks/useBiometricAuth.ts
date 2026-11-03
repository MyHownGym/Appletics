import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useI18n } from '@/hooks/useI18n';
import { useFocusEffect } from 'expo-router';
import { BiometricCapabilities, BiometricResult, getBiometricCapabilities, authenticateBiometric } from '@/services/biometricService';

export function useBiometricAuth() {
  const { language } = useI18n();
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({ available: false, type: null, label: 'Biométrie', deviceFallbackAvailable: false, reason: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const refreshVersion = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current;
    const next = await getBiometricCapabilities();
    if (!mounted.current || version !== refreshVersion.current) return;
    setCapabilities(next);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active' && !inFlight.current) void refresh(); });
    return () => listener.remove();
  }, [refresh]);
  const authenticate = useCallback(async (allowDeviceFallback = false): Promise<BiometricResult> => {
    if (inFlight.current) return { success: false, error: 'busy', message: 'Vérification en cours.' };
    if (!allowDeviceFallback && !capabilities.available) {
      const result = { success: false, error: 'not_available', message: capabilities.reason || 'Biométrie indisponible.' };
      if (mounted.current) { setMessage(result.message); setFailed(true); }
      return result;
    }
    inFlight.current = true;
    setBusy(true); setMessage(''); setFailed(false);
    const result = await authenticateBiometric(capabilities.label, allowDeviceFallback, language);
    inFlight.current = false;
    if (mounted.current) { setBusy(false); setMessage(result.message); setFailed(!result.success); }
    return result;
  }, [capabilities.available, capabilities.label, capabilities.reason, language]);
  return { capabilities, loading, busy, message, failed, authenticate, refresh };
}
