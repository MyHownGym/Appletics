import { useLanguage } from "@/hooks/useLanguage";
import s1 from "@/assets/screens/01_accueil.jpg";
import s2 from "@/assets/screens/02_verein.jpg";
import s3 from "@/assets/screens/03_gruppo.jpg";
import s4 from "@/assets/screens/04_wettkaempfe.jpg";
import s5 from "@/assets/screens/05_suisse.jpg";

const COPY = {
  fr: { badge: "L'app en images", title: "Pensée pour la piste, en 3 langues.", sub: "Sur iPhone, iPad, Android et ordinateur — sans téléchargement.", alt: ["Accueil du coach", "Vue du club", "Inviter son groupe", "Compétitions", "Réglages en 3 langues"] },
  de: { badge: "Die App in Bildern", title: "Für die Bahn gemacht, in 3 Sprachen.", sub: "Auf iPhone, iPad, Android und Computer — ohne Download.", alt: ["Coach-Startseite", "Vereinsübersicht", "Gruppe einladen", "Wettkämpfe", "Einstellungen in 3 Sprachen"] },
  it: { badge: "L'app in immagini", title: "Pensata per la pista, in 3 lingue.", sub: "Su iPhone, iPad, Android e computer — senza download.", alt: ["Home del coach", "Vista del club", "Invita il gruppo", "Gare", "Impostazioni in 3 lingue"] },
} as const;
const SHOTS = [s1, s2, s3, s4, s5];

// App screenshots (the App Store set), scrolling horizontally on phones, in a row on large screens.
export default function AppScreens() {
  const { language } = useLanguage();
  const t = COPY[language as keyof typeof COPY] ?? COPY.fr;
  return (
    <section id="captures" className="py-20 lg:py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-scroll-reveal="left" className="text-center mb-10">
          <span className="inline-block bg-orange-100 text-primary-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">{t.badge}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">{t.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.sub}</p>
        </div>
        <div className="-mx-4 px-4 flex gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 lg:justify-center" style={{ scrollbarWidth: "none" }}>
          {SHOTS.map((src, i) => (
            <img key={src} src={src} alt={t.alt[i]} loading="lazy" width={600} height={1304}
              className="snap-center shrink-0 w-[62vw] max-w-[260px] lg:w-[19%] lg:max-w-none rounded-[28px] shadow-xl ring-1 ring-black/5" />
          ))}
        </div>
      </div>
    </section>
  );
}
