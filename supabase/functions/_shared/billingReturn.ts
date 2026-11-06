// Public navigation only. A return URL never authenticates a user or grants an entitlement.
export const hostedBillingReturnScheme = 'appletics://billing-return';
export type BillingReturnMode = 'ios-session' | 'android-app' | 'preview' | 'web';
export function normalizeBillingReturnMode(value: unknown): BillingReturnMode {
  return value === 'ios-session' || value === 'android-app' || value === 'web' ? value : 'preview';
}
export function normalizeBillingReturnLanguage(value: unknown): 'fr' | 'de' | 'it' {
  return value === 'de' || value === 'it' ? value : 'fr';
}
export function resolveBillingReturnUrl(backendUrl: string, origin: string | null, candidate: unknown, mode: unknown, language: unknown): string {
  // Web may return only to its requesting HTTPS origin. Native callbacks always use our HTTPS bridge.
  if (normalizeBillingReturnMode(mode) === 'web' && typeof candidate === 'string' && origin) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' && url.origin === origin && !url.username && !url.password && url.pathname.endsWith('/billing-return')) {
        url.search = ''; url.hash = '';
        return url.toString();
      }
    } catch { /* Untrusted or unavailable web URL: use the safe bridge below. */ }
  }
  const url = new URL(`${backendUrl.replace(/\/$/, '')}/functions/v1/appletics-billing-return`);
  url.searchParams.set('mode', normalizeBillingReturnMode(mode));
  url.searchParams.set('lang', normalizeBillingReturnLanguage(language));
  return url.toString();
}
const copy = {
  fr: { title: 'Retour à Appletics', cancelled: 'Paiement annulé', message: 'Revenez dans Appletics pour vérifier le paiement auprès de Stripe. Cette page ne confirme pas votre abonnement.', cancelMessage: 'Vous pouvez revenir dans Appletics et choisir une formule. Le statut du paiement sera vérifié dans l’app.', back: 'Revenir dans Appletics', help: 'Comment revenir dans Appletics', close: 'Dans une fenêtre Safari ouverte depuis l’app, fermez cette fenêtre avec la coche ou « Terminé » en haut à gauche. Si Safari est ouvert séparément, retournez à Appletics avec le sélecteur d’apps.', verify: 'À votre retour, Appletics vérifie le paiement automatiquement. Sinon, appuyez sur « Vérifier le paiement ». Ne recommencez pas le paiement uniquement parce que le retour a échoué.', native: 'Si le retour automatique est indisponible, fermez cette fenêtre et rouvrez Appletics. Ce lien nécessite une session de retour ouverte depuis l’app ou un build Appletics installé.', web: 'Dans l’aperçu web, revenez à l’onglet de l’app puis appuyez sur « Vérifier le paiement ».' },
  de: { title: 'Zurück zu Appletics', cancelled: 'Zahlung abgebrochen', message: 'Kehren Sie zu Appletics zurück, um die Zahlung bei Stripe zu prüfen. Diese Seite bestätigt kein Abonnement.', cancelMessage: 'Sie können zu Appletics zurückkehren und einen Tarif wählen. Der Zahlungsstatus wird in der App geprüft.', back: 'Zurück zu Appletics', help: 'So kehren Sie zu Appletics zurück', close: 'Schließen Sie in einem aus der App geöffneten Safari-Fenster dieses Fenster über das Häkchen oder „Fertig“ oben links. Wechseln Sie bei separat geöffnetem Safari über den App-Umschalter zu Appletics.', verify: 'Appletics prüft die Zahlung nach der Rückkehr automatisch. Tippen Sie andernfalls auf „Zahlung prüfen“. Starten Sie nicht allein wegen eines fehlgeschlagenen Rücksprungs eine neue Zahlung.', native: 'Falls die automatische Rückkehr nicht verfügbar ist, schließen Sie das Fenster und öffnen Sie Appletics. Dieser Link benötigt eine von der App gestartete Rückkehrsitzung oder einen installierten Appletics-Build.', web: 'Kehren Sie in der Web-Vorschau zum App-Tab zurück und tippen Sie auf „Zahlung prüfen“.' },
  it: { title: 'Torna ad Appletics', cancelled: 'Pagamento annullato', message: 'Torna ad Appletics per verificare il pagamento con Stripe. Questa pagina non conferma il tuo abbonamento.', cancelMessage: 'Puoi tornare ad Appletics e scegliere una formula. Lo stato del pagamento verrà verificato nell’app.', back: 'Torna ad Appletics', help: 'Come tornare ad Appletics', close: 'In una finestra Safari aperta dall’app, chiudi questa finestra con il segno di spunta o « Fine » in alto a sinistra. Se Safari è aperto separatamente, torna ad Appletics con il selettore delle app.', verify: 'Al ritorno, Appletics verifica automaticamente il pagamento. Altrimenti premi « Verifica il pagamento ». Non ripetere il pagamento solo perché il ritorno non è riuscito.', native: 'Se il ritorno automatico non è disponibile, chiudi questa finestra e riapri Appletics. Questo link richiede una sessione di ritorno avviata dall’app o un build Appletics installato.', web: 'Nell’anteprima web, torna alla scheda dell’app e premi « Verifica il pagamento ».' },
} as const;
export function renderBillingReturnPage(requestUrl: string): string {
  const params = new URL(requestUrl).searchParams;
  const language = normalizeBillingReturnLanguage(params.get('lang'));
  const mode = normalizeBillingReturnMode(params.get('mode'));
  const text = copy[language];
  const cancelled = params.get('result') === 'cancelled';
  const title = cancelled ? text.cancelled : text.title;
  const native = mode === 'ios-session' || mode === 'android-app';
  // No auto-navigation scripts or arbitrary redirect parameter. Legacy/preview pages never launch an unregistered scheme.
  const href = native ? `${hostedBillingReturnScheme}?source=hosted&amp;result=${cancelled ? 'cancelled' : 'success'}` : '#return-help';
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui;background:#fff5ed;color:#0f172a;margin:0;min-height:100vh;display:grid;place-items:center}main{width:100%;max-width:440px;box-sizing:border-box;padding:24px}h1{font-size:24px}p{font-size:16px;line-height:1.6}a{display:block;background:#9f2d0b;color:white;padding:18px;border-radius:16px;text-align:center;text-decoration:none;font-weight:600}.badge{color:#9f2d0b;font-weight:700}#return-help{padding:16px;border-radius:16px;background:white;border:1px solid #9f2d0b33;margin-top:16px}#return-help:target{outline:2px solid #9f2d0b}a:focus-visible{outline:3px solid #0f172a;outline-offset:4px}</style></head><body><main><p class="badge">APPLETICS · STRIPE TEST</p><h1>${title}</h1><p>${cancelled ? text.cancelMessage : text.message}</p><a href="${href}">${native ? text.back : text.help}</a><div id="return-help"><p>${native ? text.native : mode === 'web' ? text.web : text.close}</p><p>${text.verify}</p></div></main></body></html>`;
}
