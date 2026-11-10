import { UserPlus, Play, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/constants/translations";
import HeroAppVisual from "@/components/features/HeroAppVisual";
import heroBg from "@/assets/hero-bg.jpg";

export default function Hero() {
  const { language } = useLanguage();
  const t = translations[language].hero;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Athlétisme suisse" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-900/70 to-primary-500/40" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 opacity-5 xl:block">
        <svg width="300" height="300" viewBox="0 0 100 100" fill="white">
          <rect x="38" y="10" width="24" height="80" rx="4" /><rect x="10" y="38" width="80" height="24" rx="4" />
        </svg>
      </div>
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-28 lg:pt-36">
        <div data-scroll-reveal="left" className="min-w-0 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary-500" />
            <span className="text-sm font-medium text-white/90">{t.badge}</span>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            <span className="block">{t.headline}</span>
            <span className="block text-primary-500 drop-shadow-lg">{t.headline2}</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">{t.sub}</p>
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <a href="#founders-form" className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-primary-500 px-7 py-4 font-bold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <UserPlus size={20} aria-hidden="true" /><span>{t.ctaPrimary}</span><ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#features" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <Play size={16} /><span>{t.ctaSecondary}</span>
            </a>
          </div>
          <div className="flex flex-wrap gap-6">
            {t.stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{stat.value}</span>
                <span className="text-sm leading-tight text-white/80">{stat.label}</span>
                {i < t.stats.length - 1 && <span aria-hidden="true" className="ml-4 text-white/20">·</span>}
              </div>
            ))}
          </div>
        </div>
        <HeroAppVisual />
      </div>
    </section>
  );
}
