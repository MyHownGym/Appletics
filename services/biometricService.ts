import { Platform } from 'react-native';
import { Language } from '@/constants/i18n';
import { translateUiText } from '@/services/localizationService';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCapabilities {
  available: boolean;
  type: 'face' | 'fingerprint' | 'other' | null;
  label: string;
  deviceFallbackAvailable: boolean;
  reason: string;
}
export interface BiometricResult { success: boolean; error?: string; message: string }

export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const unavailable: BiometricCapabilities = { available: false, type: null, label: 'Biométrie', deviceFallbackAvailable: false, reason: '' };
  if (Platform.OS === 'web') return { ...unavailable, reason: 'Face ID et le code de l’appareil nécessitent une application iOS ou Android installée, pas l’aperçu web.' };
  try {
    const [hardware, enrolled, types, securityLevel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(), LocalAuthentication.getEnrolledLevelAsync(),
    ]);
    const type = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? 'face'
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ? 'fingerprint' : hardware ? 'other' : null;
    const label = type === 'face' ? (Platform.OS === 'ios' ? 'Face ID' : 'Reconnaissance faciale')
      : type === 'fingerprint' ? (Platform.OS === 'ios' ? 'Touch ID' : 'Empreinte digitale') : 'Biométrie';
    const expoGoFace = Platform.OS === 'ios' && type === 'face' && Constants.executionEnvironment === 'storeClient';
    const reason = expoGoFace ? 'Face ID n’est pas pris en charge dans Expo Go. Installez un nouveau build iOS Appletics contenant l’autorisation Face ID.'
      : !hardware ? 'Aucun capteur biométrique disponible sur cet appareil.'
      : !enrolled ? `Configurez ${label} dans les réglages de votre appareil, puis revenez ici.` : '';
    return { available: hardware && enrolled && !expoGoFace, type, label, deviceFallbackAvailable: securityLevel !== LocalAuthentication.SecurityLevel.NONE, reason };
  } catch {
    return { ...unavailable, reason: 'Impossible de vérifier la biométrie. Réessayez sur l’application installée.' };
  }
}

function failureMessage(code: string): string {
  switch (code) {
    case 'user_cancel': case 'app_cancel': case 'system_cancel': return 'Vérification annulée. Réessayez ou utilisez le code de l’appareil.';
    case 'user_fallback': return 'Utilisez le bouton « Code de l’appareil » pour le secours.';
    case 'lockout': return 'Biométrie temporairement bloquée. Déverrouillez votre appareil avec son code, puis réessayez.';
    case 'not_enrolled': return 'Configurez Face ID ou votre empreinte dans les réglages de votre appareil.';
    case 'not_available': case 'invalid_context': return 'Biométrie indisponible. Autorisez Face ID dans Réglages iOS > Appletics et installez un nouveau build iOS si nécessaire.';
    case 'passcode_not_set': return 'Configurez un code de verrouillage dans les réglages de votre appareil.';
    case 'authentication_failed': return 'Reconnaissance non validée. Réessayez ou utilisez le code de l’appareil.';
    case 'timeout': return 'Le délai de vérification est écoulé. Réessayez.';
    default: return 'La vérification a échoué. Réessayez ou utilisez le code de l’appareil.';
  }
}

let inProgress = false;
export async function authenticateBiometric(label: string, allowDeviceFallback = false, language: Language = 'fr'): Promise<BiometricResult> {
  if (Platform.OS === 'web') return { success: false, error: 'not_available', message: 'Cette vérification nécessite l’application installée sur votre appareil.' };
  if (inProgress) return { success: false, error: 'busy', message: 'Une vérification est déjà en cours.' };
  inProgress = true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: translateUiText(allowDeviceFallback ? 'Déverrouiller Appletics · code de l’appareil en secours' : `Déverrouiller Appletics avec ${label}`, language),
      cancelLabel: translateUiText('Annuler', language),
      // First request is biometric-only: a device PIN cannot silently enable Face ID.
      disableDeviceFallback: !allowDeviceFallback,
      fallbackLabel: allowDeviceFallback ? translateUiText('Code de l’appareil', language) : '',
    });
    if (result.success) return { success: true, message: allowDeviceFallback ? 'Appareil vérifié.' : `${label} vérifié.` };
    return { success: false, error: result.error, message: failureMessage(result.error) };
  } catch {
    return { success: false, error: 'not_available', message: failureMessage('not_available') };
  } finally { inProgress = false; }
}
