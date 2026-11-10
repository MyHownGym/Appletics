import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICING_FAQ } from "@/constants/pricingFAQ";

interface FAQItem {
  q: string;
  a: string;
}

export const faqData: Record<string, { badge: string; title: string; subtitle: string; items: FAQItem[] }> = {
  fr: {
    badge: "FAQ",
    title: "Questions fréquentes",
    subtitle: "Tout ce que vous voulez savoir sur Appletics avant de commencer.",
    items: [
      {
        q: "Comment inviter mes athlètes sur Appletics ?",
        a: "Une fois votre profil coach créé, rendez-vous dans la section « Athlètes » et appuyez sur « Inviter ». Vous pouvez envoyer un lien d'invitation par message ou e-mail. Vos athlètes créent leur compte gratuitement en moins de 2 minutes. Aucune carte bancaire requise pour eux.",
      },
      {
        q: "Quelle est la différence entre Basic, Pro et Elite ?",
        a: PRICING_FAQ.fr,
      },
      {
        q: "Mes données sont-elles hébergées en Suisse ? (nLPD)",
        a: "Oui. Toutes les données Appletics (profils coachs, données d'athlètes, plans d'entraînement) sont hébergées sur des serveurs en Suisse, en conformité avec la nouvelle Loi fédérale sur la protection des données (nLPD, en vigueur depuis le 1er septembre 2023). Vos données ne sont jamais transmises à des serveurs étrangers.",
      },
      {
        q: "C'est quoi le programme Coachs & Clubs Fondateurs ?",
        a: "Les coachs et clubs fondateurs sont les premiers à rejoindre Appletics avant le lancement officiel. En échange de vos retours et de votre aide pour faire connaître l'app dans votre club et réseau, vous bénéficiez de 6 mois de formule Premium offerts. Un badge « Fondateur » est affiché sur votre profil. Les places sont limitées.",
      },
      {
        q: "Quand et sur quels appareils Appletics est-elle disponible ?",
        a: "Appletics est une web app : elle s'ouvre sur app.appletics.ch depuis un iPhone, un iPad, un téléphone Android ou un ordinateur, sans passer par l'App Store ni Google Play. Lancement officiel le mardi 1er décembre 2026. Astuce : ajoute-la à ton écran d'accueil pour l'utiliser comme une app, avec les notifications.",
      },
      {
        q: "Appletics fonctionne-t-elle pour toutes les disciplines d'athlétisme ?",
        a: "Oui. Appletics couvre toutes les disciplines : sprint, demi-fond, fond, sauts, lancers, épreuves combinées et marche. La planification, le suivi des chronos, des hauteurs et des distances ainsi que les statistiques sont adaptés à chaque discipline.",
      },
      {
        q: "Est-ce que je peux utiliser Appletics dans plusieurs langues ?",
        a: "Oui. Appletics est entièrement trilingue : français, allemand et italien. Chaque utilisateur choisit sa langue préférée. Un coach alémanique peut ainsi gérer son groupe en allemand pendant que ses collègues romands utilisent le français.",
      },
    ],
  },
  de: {
    badge: "FAQ",
    title: "Häufige Fragen",
    subtitle: "Alles, was Sie über Appletics wissen möchten, bevor Sie starten.",
    items: [
      {
        q: "Wie lade ich meine Athleten zu Appletics ein?",
        a: "Nachdem Sie Ihr Coach-Profil erstellt haben, gehen Sie zum Bereich «Athleten» und tippen auf «Einladen». Sie können einen Einladungslink per Nachricht oder E-Mail versenden. Ihre Athleten erstellen ihr Konto kostenlos in weniger als 2 Minuten. Keine Kreditkarte erforderlich.",
      },
      {
        q: "Was ist der Unterschied zwischen Basic, Pro und Elite?",
        a: PRICING_FAQ.de,
      },
      {
        q: "Werden meine Daten in der Schweiz gehostet? (revDSG)",
        a: "Ja. Alle Appletics-Daten (Coach-Profile, Athletendaten, Trainingspläne) werden auf Servern in der Schweiz gehostet, in Übereinstimmung mit dem revidierten Bundesgesetz über den Datenschutz (revDSG, in Kraft seit 1. September 2023). Ihre Daten werden niemals auf ausländische Server übertragen.",
      },
      {
        q: "Was ist das Gründer-Coach- und Gründer-Vereinsprogramm?",
        a: "Gründer-Coaches und Gründer-Vereine sind die Ersten, die Appletics vor dem offiziellen Launch beitreten. Als Gegenleistung für Ihr Feedback und Ihre Hilfe, die App in Ihrem Verein bekannt zu machen, erhalten Sie 6 Monate Premium gratis. Ein «Gründer»-Badge wird auf Ihrem Profil angezeigt. Die Plätze sind begrenzt.",
      },
      {
        q: "Wann und auf welchen Geräten ist Appletics verfügbar?",
        a: "Appletics ist eine Web-App: Sie öffnet sich unter app.appletics.ch auf iPhone, iPad, Android-Smartphone oder Computer, ohne App Store oder Google Play. Offizieller Start am Dienstag, 1. Dezember 2026. Tipp: Füge sie deinem Startbildschirm hinzu, um sie wie eine App mit Benachrichtigungen zu nutzen.",
      },
      {
        q: "Funktioniert Appletics für alle Leichtathletik-Disziplinen?",
        a: "Ja. Appletics deckt alle Disziplinen ab: Sprint, Mittelstrecke, Langstrecke, Sprung, Wurf, Mehrkampf und Gehen. Planung, Zeitmessung, Höhen- und Weitenerfassung sowie Statistiken sind für jede Disziplin angepasst.",
      },
      {
        q: "Kann ich Appletics in mehreren Sprachen verwenden?",
        a: "Ja. Appletics ist vollständig dreisprachig: Deutsch, Französisch und Italienisch. Jeder Nutzer wählt seine bevorzugte Sprache. Ein alemannischer Coach kann seine Gruppe auf Deutsch verwalten, während seine Westschweizer Kollegen Französisch verwenden.",
      },
    ],
  },
  it: {
    badge: "FAQ",
    title: "Domande frequenti",
    subtitle: "Tutto quello che volete sapere su Appletics prima di iniziare.",
    items: [
      {
        q: "Come invito i miei atleti su Appletics?",
        a: "Una volta creato il profilo coach, vai nella sezione «Atleti» e premi «Invita». Puoi inviare un link di invito tramite messaggio o e-mail. I tuoi atleti creano il loro account gratuitamente in meno di 2 minuti. Nessuna carta di credito richiesta.",
      },
      {
        q: "Qual è la differenza tra Basic, Pro ed Elite?",
        a: PRICING_FAQ.it,
      },
      {
        q: "I miei dati sono ospitati in Svizzera? (nLPD)",
        a: "Sì. Tutti i dati Appletics (profili coach, dati atleti, piani di allenamento) sono ospitati su server in Svizzera, in conformità con la nuova Legge federale sulla protezione dei dati (nLPD, in vigore dal 1° settembre 2023). I tuoi dati non vengono mai trasmessi a server stranieri.",
      },
      {
        q: "Cos'è il programma Coach e Club Fondatori?",
        a: "I coach e i club fondatori sono i primi a unirsi ad Appletics prima del lancio ufficiale. In cambio dei loro feedback e del loro aiuto per far conoscere l'app nel club e nella rete, ricevono 6 mesi di Premium in regalo. Un badge «Fondatore» viene visualizzato sul loro profilo. I posti sono limitati.",
      },
      {
        q: "Quando e su quali dispositivi è disponibile Appletics?",
        a: "Appletics è una web app: si apre su app.appletics.ch da iPhone, iPad, smartphone Android o computer, senza App Store né Google Play. Lancio ufficiale martedì 1° dicembre 2026. Consiglio: aggiungila alla schermata Home per usarla come un'app, con le notifiche.",
      },
      {
        q: "Appletics funziona per tutte le discipline dell'atletica?",
        a: "Sì. Appletics copre tutte le discipline: sprint, mezzofondo, fondo, salti, lanci, prove multiple e marcia. La pianificazione, il monitoraggio dei tempi, delle altezze e delle distanze, e le statistiche sono adattati per ogni disciplina.",
      },
      {
        q: "Posso usare Appletics in più lingue?",
        a: "Sì. Appletics è completamente trilingue: francese, tedesco e italiano. Ogni utente sceglie la propria lingua preferita. Un coach germanofono può gestire il suo gruppo in tedesco mentre i colleghi romandi usano il francese.",
      },
    ],
  },
};

export default function FAQ() {
  const { language } = useLanguage();
  const t = faqData[language];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div data-scroll-reveal="right" className="text-center mb-12">
          <span className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
            {t.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {t.title}
          </h2>
          <p className="text-lg text-gray-500">{t.subtitle}</p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {t.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                data-scroll-reveal={i % 2 === 0 ? "left" : "right"}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-primary-200 bg-primary-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-700"
                  id={`faq-question-${i}`}
                  aria-controls={`faq-answer-${i}`}
                  aria-expanded={isOpen}
                >
                  <span className={`font-semibold text-base leading-snug ${isOpen ? "text-primary-600" : "text-gray-900"}`}>
                    {item.q}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen ? "bg-primary-500 text-white rotate-180" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </div>
                </button>

                <div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`} hidden={!isOpen}>
                  <div className="px-6 pb-5">
                    <div className="h-px bg-primary-100 mb-4" />
                    <p className="text-muted-foreground text-base leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div data-scroll-reveal="left" className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            {language === "fr" && "Une autre question ? "}
            {language === "de" && "Noch eine Frage? "}
            {language === "it" && "Un'altra domanda? "}
            <a
              href="mailto:contact@appletics.ch"
              className="text-primary-500 font-semibold hover:underline"
            >
              contact@appletics.ch
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
