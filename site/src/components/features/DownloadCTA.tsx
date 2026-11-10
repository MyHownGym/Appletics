import { Star, Users } from "lucide-react";
import StoreAvailability from "@/components/features/StoreAvailability";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/constants/translations";

export default function DownloadCTA() {
  const { language } = useLanguage();
  const t = translations[language].download;

  return (
    <section id="download" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-orange" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Swiss cross */}
      <div className="absolute top-8 right-8 w-12 h-12 opacity-20">
        <svg viewBox="0 0 100 100" fill="white">
          <rect x="38" y="10" width="24" height="80" rx="4" />
          <rect x="10" y="38" width="80" height="24" rx="4" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <span data-scroll-reveal="left" className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/30">
          {t.badge}
        </span>

        <h2 data-scroll-reveal="left" className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
          {t.title}
        </h2>
        <p data-scroll-reveal="right" className="text-xl text-white/80 mb-10 max-w-xl mx-auto">{t.subtitle}</p>

        <StoreAvailability language={language} />

        {/* Founders program */}
        <div data-scroll-reveal="right" className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star size={18} className="text-yellow-300" fill="currentColor" />
            <span className="text-white font-bold">{t.founders}</span>
          </div>
          <p className="text-white/80 text-sm">{t.foundersDesc}</p>
          <a
            href="#founders-form"
            className="mt-4 inline-flex min-h-11 items-center justify-center text-white underline underline-offset-2 text-base font-semibold hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {language === "fr" && "Demander à devenir coach/club fondateur →"}
            {language === "de" && "Als Gründer-Coach/Verein bewerben →"}
            {language === "it" && "Richiedere di diventare coach/club fondatore →"}
          </a>
          <div className="mt-4 flex justify-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1">
              <Users size={12} />
              FR · DE · IT
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              🇨🇭 Made in Switzerland
            </span>
          </div>
        </div>

        {/* App rating preview */}
        <div data-scroll-reveal="left" className="mt-10 flex justify-center gap-1 items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={18} className="text-yellow-300" fill="currentColor" />
          ))}
          <span className="ml-2 text-white/80 text-sm font-medium">
            {language === "fr" && "Pensée avec des coachs suisses"}
            {language === "de" && "Mit Schweizer Coachs entwickelt"}
            {language === "it" && "Pensata con coach svizzeri"}
          </span>
        </div>
      </div>
    </section>
  );
}
