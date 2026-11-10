import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { translations, type Language } from "@/constants/translations";

interface StoreAvailabilityProps { language: Language }
export const APP_URL = "https://app.appletics.ch";

// Appletics is a web app: one link for iPhone, iPad, Android and computers (no store).
export default function StoreAvailability({ language }: StoreAvailabilityProps) {
  const t = translations[language].download;
  return (
    <div data-scroll-reveal="left" className="mb-12 flex flex-col items-center gap-5">
      <a href={APP_URL} className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-primary-600 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        <span>{t.appStore} · app.appletics.ch</span>
        <ExternalLink size={20} aria-hidden="true" />
      </a>
      <div className="flex items-center gap-4 text-white/90" aria-hidden="true">
        <Smartphone size={22} /><Tablet size={22} /><Monitor size={22} />
      </div>
      <p className="max-w-md text-base text-white/85">{t.googlePlay}</p>
    </div>
  );
}
