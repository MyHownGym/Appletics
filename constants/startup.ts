// Startup states describe actual readiness; a timeout never grants account access.
export const STARTUP_WAIT_MS = 15_000;
export const STARTUP_READ_TIMEOUT_MS = 12_000;
export const STARTUP_SESSION_DISPATCH_REVISION = '1';
export type StartupPhase = 'provider' | 'authentication' | 'device' | 'profile' | 'consent' | 'ready';
export const startupCopy = {
  fr: {
    title: 'Ouverture d’Appletics', blocked: 'Démarrage interrompu',
    waiting: 'Vérification de votre accès et de vos données…',
    slow: 'Le chargement prend trop de temps. Vérifiez votre connexion, puis réessayez.',
    safe: 'Votre historique local est conservé. Aucune donnée ne sera effacée.',
    retry: 'Réessayer', support: 'Contacter le support', supportError: 'Envoyez une capture de cet écran à contact@onspace.ai.',
    phase: { provider: 'Initialisation de la connexion', authentication: 'Restauration de la session', device: 'Lecture des réglages de cet appareil', profile: 'Restauration du profil et de l’historique', consent: 'Choisissez si vous souhaitez conserver votre historique dans la fenêtre affichée.', ready: 'Prêt' },
  },
  de: {
    title: 'Appletics wird geöffnet', blocked: 'Start unterbrochen',
    waiting: 'Zugriff und Daten werden geprüft…',
    slow: 'Das Laden dauert zu lange. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    safe: 'Ihr lokaler Verlauf bleibt erhalten. Es werden keine Daten gelöscht.',
    retry: 'Erneut versuchen', support: 'Support kontaktieren', supportError: 'Senden Sie einen Screenshot an contact@onspace.ai.',
    phase: { provider: 'Verbindung wird initialisiert', authentication: 'Sitzung wird wiederhergestellt', device: 'Geräteeinstellungen werden gelesen', profile: 'Profil und Verlauf werden wiederhergestellt', consent: 'Wählen Sie im angezeigten Dialog, ob Ihr Verlauf übernommen werden soll.', ready: 'Bereit' },
  },
  it: {
    title: 'Apertura di Appletics', blocked: 'Avvio interrotto',
    waiting: 'Verifica dell’accesso e dei dati…',
    slow: 'Il caricamento richiede troppo tempo. Verifica la connessione e riprova.',
    safe: 'La cronologia locale viene conservata. Nessun dato verrà eliminato.',
    retry: 'Riprova', support: 'Contatta il supporto', supportError: 'Invia una schermata a contact@onspace.ai.',
    phase: { provider: 'Inizializzazione della connessione', authentication: 'Ripristino della sessione', device: 'Lettura delle impostazioni del dispositivo', profile: 'Ripristino del profilo e della cronologia', consent: 'Scegli nella finestra se conservare la cronologia.', ready: 'Pronto' },
  },
} as const;
