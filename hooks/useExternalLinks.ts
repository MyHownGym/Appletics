import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { Colors } from '@/constants/theme';
import { normalizeWebUrl, getLinkHost, isSystemLink } from '@/services/linkService';

function openInNewTab(url: string) {
  // No 'noopener' feature here: with it, window.open returns null and a blocked pop-up can't be detected.
  const opened = window.open(url, '_blank');
  if (opened) { try { opened.opener = null; } catch { /* cross-origin */ } }
  else window.location.assign(url);
}

// Native uses Safari View Controller / Android Custom Tabs, never openURL for web pages.
// The web preview uses an internal route; external opening is always an explicit choice.
export function useExternalLinks() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const openLink = useCallback(async (value: string): Promise<void> => {
    const url = normalizeWebUrl(value);
    if (url) {
      try {
        if (Platform.OS === 'web') {
          // Pages that refuse to load inside the app: straight to the browser, in a new tab/window.
          openInNewTab(url);
        } else {
          await WebBrowser.openBrowserAsync(url, {
            toolbarColor: Colors.surface,
            controlsColor: Colors.primary,
            showTitle: true,
            enableBarCollapsing: false,
            createTask: false,
            dismissButtonStyle: 'close',
          });
        }
      } catch {
        showAlert('Lien indisponible', 'Impossible d’ouvrir cette page dans l’app. Réessayez ou choisissez le navigateur externe.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Navigateur externe', onPress: () => { void Linking.openURL(url).catch(() => showAlert('Lien indisponible', 'Ce lien ne peut pas être ouvert.')); } },
        ]);
      }
      return;
    }
    if (isSystemLink(value)) {
      showAlert('Ouvrir une application système', 'Les e-mails, SMS et appels nécessitent la messagerie ou le téléphone de votre appareil. Continuer ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => { void Linking.openURL(value).catch(() => showAlert('Application indisponible', 'Aucune application compatible n’est disponible sur cet appareil.')); } },
      ]);
      return;
    }
    showAlert('Lien non pris en charge', 'Seules les pages HTTP/HTTPS et les liens de contact sont autorisés.');
  }, [router, showAlert]);
  const openInExternalBrowser = useCallback((value: string) => {
    const url = normalizeWebUrl(value);
    if (!url) return;
    if (Platform.OS === 'web') { openInNewTab(url); return; }
    showAlert('Navigateur externe', `Quitter la vue intégrée pour ouvrir ${getLinkHost(url)} ?`, [
      { text: 'Rester dans l’app', style: 'cancel' },
      { text: 'Ouvrir', onPress: () => { void Linking.openURL(url).catch(() => showAlert('Lien indisponible', 'Impossible d’ouvrir le navigateur externe.')); } },
    ]);
  }, [showAlert]);
  return { openLink, openInExternalBrowser };
}
