import { Check, X } from "lucide-react";
import ComparisonRow from "@/components/features/ComparisonRow";
import { useLanguage } from "@/hooks/useLanguage";

const content = {
  fr: {
    badge: "Pourquoi Appletics ?",
    title: "Fini le chaos,\nplace au coaching",
    subtitle: "Chaque semaine, des coachs suisses perdent des heures sur des outils pas faits pour l'athlétisme. Appletics change ça.",
    before: "Sans Appletics",
    after: "Avec Appletics",
    comparisons: [
      {
        icon: "💬",
        before: "40 messages WhatsApp pour organiser une séance",
        after: "1 notification envoyée à tout le groupe en 2 min",
      },
      {
        icon: "📊",
        before: "Excel pour suivre les chronos et les sauts",
        after: "Graphiques automatiques, évolution visible en un clin d'œil",
      },
      {
        icon: "📁",
        before: "PDFs éparpillés, plans d'entraînement perdus",
        after: "Tous les plans au même endroit, accessibles hors ligne",
      },
      {
        icon: "⚠️",
        before: "Aucune visibilité sur la charge d'entraînement",
        after: "Tableau de bord avec alertes surmenage en temps réel",
      },
      {
        icon: "🌍",
        before: "3 langues = 3 groupes WhatsApp séparés",
        after: "1 seule app — chacun dans sa langue FR / DE / IT",
      },
      {
        icon: "🏆",
        before: "Compétitions notées à la main sur papier",
        after: "Résultats, chronos et classements centralisés",
      },
    ],
  },
  de: {
    badge: "Warum Appletics?",
    title: "Schluss mit dem Chaos,\nher mit dem Coaching",
    subtitle: "Schweizer Coaches verlieren jede Woche Stunden mit Tools, die nicht für die Leichtathletik gemacht sind. Appletics ändert das.",
    before: "Ohne Appletics",
    after: "Mit Appletics",
    comparisons: [
      {
        icon: "💬",
        before: "40 WhatsApp-Nachrichten, um ein Training zu organisieren",
        after: "1 Benachrichtigung an die ganze Gruppe in 2 Min.",
      },
      {
        icon: "📊",
        before: "Excel für Zeiten und Sprungweiten",
        after: "Automatische Diagramme, sichtbare Entwicklung auf einen Blick",
      },
      {
        icon: "📁",
        before: "Verstreute PDFs, verlorene Trainingspläne",
        after: "Alle Pläne an einem Ort, offline verfügbar",
      },
      {
        icon: "⚠️",
        before: "Keine Übersicht über die Trainingsbelastung",
        after: "Dashboard mit Echtzeit-Überlastungswarnungen",
      },
      {
        icon: "🌍",
        before: "3 Sprachen = 3 separate WhatsApp-Gruppen",
        after: "1 einzige App — jeder in seiner Sprache DE / FR / IT",
      },
      {
        icon: "🏆",
        before: "Wettkampfergebnisse handschriftlich auf Papier",
        after: "Ergebnisse, Zeiten und Rankings zentral gespeichert",
      },
    ],
  },
  it: {
    badge: "Perché Appletics?",
    title: "Basta caos,\nspazio al coaching",
    subtitle: "I coach svizzeri perdono ore ogni settimana con strumenti non pensati per l'atletica. Appletics cambia tutto.",
    before: "Senza Appletics",
    after: "Con Appletics",
    comparisons: [
      {
        icon: "💬",
        before: "40 messaggi WhatsApp per organizzare un allenamento",
        after: "1 notifica inviata a tutto il gruppo in 2 min",
      },
      {
        icon: "📊",
        before: "Excel per seguire i tempi e i salti",
        after: "Grafici automatici, evoluzione visibile in un colpo d'occhio",
      },
      {
        icon: "📁",
        before: "PDF sparsi, piani di allenamento persi",
        after: "Tutti i piani in un posto, accessibili offline",
      },
      {
        icon: "⚠️",
        before: "Nessuna visibilità sul carico di allenamento",
        after: "Dashboard con avvisi di sovraccarico in tempo reale",
      },
      {
        icon: "🌍",
        before: "3 lingue = 3 gruppi WhatsApp separati",
        after: "1 sola app — ognuno nella sua lingua IT / FR / DE",
      },
      {
        icon: "🏆",
        before: "Risultati delle gare annotati a mano su carta",
        after: "Risultati, tempi e classifiche centralizzati",
      },
    ],
  },
};

export default function Advantages() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <section id="advantages" lang={language} className="advantages-section bg-background py-12 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div data-scroll-reveal="right" className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <span className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
            {t.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight whitespace-pre-line [overflow-wrap:anywhere]">
            {t.title}
          </h2>
          <p className="comparison-intro text-base leading-relaxed sm:text-lg">{t.subtitle}</p>
        </div>

        {/* Column headers */}
        <div data-scroll-reveal="left" className="hidden md:grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] gap-3 mb-3 px-1">
          <div />
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100">
            <X aria-hidden="true" size={20} className="shrink-0" />
            <span className="text-sm font-bold text-red-600 uppercase tracking-wide">{t.before}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100">
            <Check aria-hidden="true" size={20} className="shrink-0" />
            <span className="text-sm font-bold text-green-600 uppercase tracking-wide">{t.after}</span>
          </div>
        </div>

        {/* Comparison rows */}
        <div className="space-y-4 md:space-y-2.5">
          {t.comparisons.map((row, i) => (
            <ComparisonRow key={i} row={row} index={i} beforeLabel={t.before} afterLabel={t.after} />
          ))}
        </div>

        {/* Bottom quote */}
        <div data-scroll-reveal="right" className="mt-8 sm:mt-12 text-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl py-6 px-4 sm:py-8 sm:px-6 shadow-lg">
          <p className="text-xl sm:text-2xl font-black text-primary-foreground leading-snug italic mb-2">
            {language === "fr" && '"Ta séance planifiée et envoyée au groupe en 2 minutes."'}
            {language === "de" && '"Ihr Training geplant und an die Gruppe gesendet in 2 Minuten."'}
            {language === "it" && '"Il tuo allenamento pianificato e inviato al gruppo in 2 minuti."'}
          </p>
          <p className="text-white/70 text-sm">
            {language === "fr" && "— Principe Appletics"}
            {language === "de" && "— Appletics-Prinzip"}
            {language === "it" && "— Principio Appletics"}
          </p>
        </div>
      </div>
    </section>
  );
}
