import { useLanguage } from "@/hooks/useLanguage";
import logoIcon from "@/assets/logo-icon.png";

const content = {
  fr: {
    title: "Mentions légales",
    back: "← Retour à l'accueil",
    sections: [
      {
        heading: "Éditeur du site",
        body: `Appletics
Site web : appletics.ch
E-mail : contact@appletics.ch
Pays : Suisse`,
      },
      {
        heading: "Hébergement",
        body: "Le site et les données utilisateurs sont hébergés en Suisse, en conformité avec la loi fédérale sur la protection des données (nLPD).",
      },
      {
        heading: "Propriété intellectuelle",
        body: "L'ensemble des contenus présents sur ce site (textes, images, logo, marque « Appletics ») sont la propriété exclusive d'Appletics et sont protégés par le droit suisse de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.",
      },
      {
        heading: "Protection des données (nLPD)",
        body: `Conformément à la loi fédérale sur la protection des données (nLPD, en vigueur depuis le 1er septembre 2023), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.

Les données collectées via l'application Appletics (nom, e-mail, données d'entraînement) sont utilisées exclusivement pour le fonctionnement du service et ne sont pas transmises à des tiers sans consentement explicite.

Pour exercer vos droits : contact@appletics.ch`,
      },
      {
        heading: "Cookies",
        body: "Ce site utilise uniquement des cookies techniques nécessaires au bon fonctionnement (préférence de langue, session). Aucun cookie publicitaire tiers n'est déposé sans votre consentement.",
      },
      {
        heading: "Responsabilité",
        body: "Appletics s'efforce de maintenir les informations de ce site à jour et exactes. Toutefois, aucune garantie ne peut être donnée quant à l'exactitude, l'exhaustivité ou l'actualité des informations. Appletics décline toute responsabilité pour les dommages directs ou indirects résultant de l'utilisation du site.",
      },
      {
        heading: "Droit applicable et for judiciaire",
        body: "Le présent site est soumis au droit suisse. En cas de litige, les tribunaux suisses sont seuls compétents.",
      },
      {
        heading: "Contact",
        body: "Pour toute question relative aux présentes mentions légales ou à la protection de vos données :\ncontact@appletics.ch",
      },
    ],
  },
  de: {
    title: "Impressum",
    back: "← Zurück zur Startseite",
    sections: [
      {
        heading: "Herausgeber",
        body: `Appletics
Website: appletics.ch
E-Mail: contact@appletics.ch
Land: Schweiz`,
      },
      {
        heading: "Hosting",
        body: "Die Website und Benutzerdaten werden in der Schweiz gehostet, in Übereinstimmung mit dem Bundesgesetz über den Datenschutz (revDSG).",
      },
      {
        heading: "Geistiges Eigentum",
        body: "Alle Inhalte dieser Website (Texte, Bilder, Logo, Marke «Appletics») sind das ausschliessliche Eigentum von Appletics und durch das Schweizer Immaterialgüterrecht geschützt. Jede Vervielfältigung, auch auszugsweise, ist ohne vorherige Genehmigung untersagt.",
      },
      {
        heading: "Datenschutz (revDSG)",
        body: `Gemäss dem revidierten Bundesgesetz über den Datenschutz (revDSG, in Kraft seit 1. September 2023) haben Sie das Recht auf Auskunft, Berichtigung und Löschung Ihrer personenbezogenen Daten.

Die über die Appletics-App erhobenen Daten (Name, E-Mail, Trainingsdaten) werden ausschliesslich für den Betrieb des Dienstes verwendet und ohne ausdrückliche Einwilligung nicht an Dritte weitergegeben.

Um Ihre Rechte auszuüben: contact@appletics.ch`,
      },
      {
        heading: "Cookies",
        body: "Diese Website verwendet nur technisch notwendige Cookies (Spracheinstellung, Sitzung). Ohne Ihre Zustimmung werden keine Drittanbieter-Werbe-Cookies gesetzt.",
      },
      {
        heading: "Haftungsausschluss",
        body: "Appletics ist bestrebt, die Informationen auf dieser Website aktuell und korrekt zu halten. Es kann jedoch keine Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Informationen gegeben werden.",
      },
      {
        heading: "Anwendbares Recht und Gerichtsstand",
        body: "Diese Website unterliegt Schweizer Recht. Bei Streitigkeiten sind ausschliesslich Schweizer Gerichte zuständig.",
      },
      {
        heading: "Kontakt",
        body: "Bei Fragen zu diesem Impressum oder zum Datenschutz:\ncontact@appletics.ch",
      },
    ],
  },
  it: {
    title: "Note legali",
    back: "← Torna alla homepage",
    sections: [
      {
        heading: "Editore del sito",
        body: `Appletics
Sito web: appletics.ch
E-mail: contact@appletics.ch
Paese: Svizzera`,
      },
      {
        heading: "Hosting",
        body: "Il sito e i dati degli utenti sono ospitati in Svizzera, in conformità con la Legge federale sulla protezione dei dati (nLPD).",
      },
      {
        heading: "Proprietà intellettuale",
        body: "Tutti i contenuti di questo sito (testi, immagini, logo, marchio «Appletics») sono di esclusiva proprietà di Appletics e sono protetti dalla legge svizzera sulla proprietà intellettuale. Qualsiasi riproduzione, anche parziale, è vietata senza autorizzazione preventiva.",
      },
      {
        heading: "Protezione dei dati (nLPD)",
        body: `In conformità con la Legge federale sulla protezione dei dati (nLPD, in vigore dal 1° settembre 2023), lei ha il diritto di accedere, correggere ed eliminare i suoi dati personali.

I dati raccolti tramite l'app Appletics (nome, e-mail, dati di allenamento) sono utilizzati esclusivamente per il funzionamento del servizio e non vengono trasmessi a terzi senza esplicito consenso.

Per esercitare i suoi diritti: contact@appletics.ch`,
      },
      {
        heading: "Cookie",
        body: "Questo sito utilizza solo cookie tecnici necessari al buon funzionamento (preferenza lingua, sessione). Nessun cookie pubblicitario di terze parti viene depositato senza il suo consenso.",
      },
      {
        heading: "Responsabilità",
        body: "Appletics si impegna a mantenere le informazioni di questo sito aggiornate e accurate. Tuttavia, non può essere fornita alcuna garanzia quanto all'esattezza, completezza o attualità delle informazioni.",
      },
      {
        heading: "Diritto applicabile e foro competente",
        body: "Questo sito è soggetto al diritto svizzero. In caso di controversia, sono competenti esclusivamente i tribunali svizzeri.",
      },
      {
        heading: "Contatto",
        body: "Per qualsiasi domanda relativa alle presenti note legali o alla protezione dei dati:\ncontact@appletics.ch",
      },
    ],
  },
};

export default function LegalMentions() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <a
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-500 transition-colors mb-8"
        >
          {t.back}
        </a>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <img src={logoIcon} alt="Appletics" className="w-12 h-12 rounded-xl" />
          <div>
            <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">appletics.ch · {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {section.heading}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <span className="text-xs text-gray-400">🇨🇭 Appletics · Made in Switzerland · {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
