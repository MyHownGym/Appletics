import { Apple, Smartphone } from "lucide-react";
import { translations, type Language } from "@/constants/translations";

interface StoreAvailabilityProps { language: Language }
const SOON: Record<Language, string> = { fr: "Bientôt disponible", de: "Bald verfügbar", it: "Presto disponibile" };

export default function StoreAvailability({ language }: StoreAvailabilityProps) {
  const t = translations[language].download;
  const stores = [
    { name: "App Store", Icon: Apple, label: t.appStore },
    { name: "Google Play", Icon: Smartphone, label: t.googlePlay },
  ];
  return (
    <div data-scroll-reveal="left" className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
      {stores.map(({ name, Icon, label }) => (
        <button key={name} type="button" disabled aria-label={label} className="inline-flex min-h-16 cursor-not-allowed items-center justify-center gap-3 rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10 px-7 py-4 text-primary-foreground">
          <Icon size={24} aria-hidden="true" />
          <span className="text-left">
            <span className="mb-1 block text-base leading-snug">{SOON[language]}</span>
            <span className="block text-lg font-bold leading-snug">{name}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
