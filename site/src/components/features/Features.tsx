import { Calendar, Users, Trophy, MessageCircle, BarChart2, Shield } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/constants/translations";
import coachImg from "@/assets/coaches.jpg";

const ICONS = {
  calendar: Calendar,
  users: Users,
  trophy: Trophy,
  "message-circle": MessageCircle,
  "bar-chart-2": BarChart2,
  shield: Shield,
};

export default function Features() {
  const { language } = useLanguage();
  const t = translations[language].features;
  const tHow = translations[language].howItWorks;

  return (
    <>
      {/* Features section */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div data-scroll-reveal="left" className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
              {t.badge}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
              {t.title}
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">{t.subtitle}</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.items.map((item, i) => {
              const Icon = ICONS[item.icon as keyof typeof ICONS];
              const isHighlighted = i === 0;
              return (
                <div
                  key={i}
                  data-scroll-reveal={i % 2 === 0 ? "left" : "right"}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                    isHighlighted
                      ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg swiss-shadow"
                      : "bg-gray-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      isHighlighted ? "bg-white/20" : "bg-primary-50"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={isHighlighted ? "text-white" : "text-primary-500"}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      isHighlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isHighlighted ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-[#FFF4EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div data-scroll-reveal="left" className="relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                <img
                  src={coachImg}
                  alt="Coach Appletics"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                {/* Floating card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-lg">✓</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Sprint 100m · Groupe A</div>
                      <div className="text-xs text-gray-500">Séance envoyée · 28 athlètes notifiés</div>
                    </div>
                    <div className="ml-auto text-xs text-primary-500 font-semibold">2 min</div>
                  </div>
                </div>
              </div>
              {/* Swiss cross accent */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg width="28" height="28" viewBox="0 0 100 100" fill="white">
                  <rect x="38" y="10" width="24" height="80" rx="4" />
                  <rect x="10" y="38" width="80" height="24" rx="4" />
                </svg>
              </div>
            </div>

            {/* Steps */}
            <div className="order-1 lg:order-2">
              <span data-scroll-reveal="right" className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
                {tHow.badge}
              </span>
              <h2 data-scroll-reveal="right" className="text-4xl lg:text-5xl font-black text-gray-900 mb-10 leading-tight">
                {tHow.title}
              </h2>
              <div className="space-y-8">
                {tHow.steps.map((step, i) => (
                  <div key={i} data-scroll-reveal={i % 2 === 0 ? "right" : "left"} className="flex gap-6 group">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-primary-100 flex items-center justify-center font-black text-primary-500 text-lg shadow-sm group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-all duration-200">
                        {step.num}
                      </div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
