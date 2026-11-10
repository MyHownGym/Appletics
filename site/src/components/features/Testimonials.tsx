import { Quote } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/constants/translations";

const LANG_COLORS: Record<string, string> = {
  FR: "bg-blue-50 text-blue-600 border-blue-100",
  DE: "bg-red-50 text-red-600 border-red-100",
  IT: "bg-green-50 text-green-700 border-green-100",
};

const AVATAR_COLORS = ["bg-primary-100 text-primary-600", "bg-blue-100 text-blue-600", "bg-amber-100 text-amber-700"];

export default function Testimonials() {
  const { language } = useLanguage();
  const t = translations[language].testimonials;

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-[#FFF4EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div data-scroll-reveal="left" className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
            {t.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            {t.title}
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {t.items.map((item, i) => (
            <div
              key={i}
              data-scroll-reveal={i % 2 === 0 ? "left" : "right"}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                i === 1 ? "bg-gray-900 text-white" : "bg-gray-50 border border-gray-100"
              }`}
            >
              {/* Quote icon */}
              <Quote
                size={32}
                className={`mb-4 ${i === 1 ? "text-primary-400" : "text-primary-200"}`}
                fill="currentColor"
              />

              {/* Quote text */}
              <p lang={item.nativeLanguage} translate="no" className={`text-sm leading-relaxed mb-6 ${i === 1 ? "text-gray-300" : "text-gray-600"}`}>
                "{item.quote}"
              </p>

              {/* Author */}
              <div lang={item.nativeLanguage} translate="no" className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${AVATAR_COLORS[i]}`}>
                  {item.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className={`font-bold text-sm ${i === 1 ? "text-white" : "text-gray-900"}`}>
                    {item.name}
                  </div>
                  <div className={`text-xs ${i === 1 ? "text-gray-400" : "text-gray-500"}`}>
                    {item.role}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${LANG_COLORS[item.lang]}`}>
                    {item.lang}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Swiss map visual */}
        <div data-scroll-reveal="right" className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-white border border-orange-100 rounded-2xl px-6 py-4">
            <div className="flex -space-x-1">
              {["🇫🇷", "🇩🇪", "🇮🇹"].map((flag, i) => (
                <span key={i} className="text-2xl">{flag}</span>
              ))}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-900">
                {language === "fr" && "Trilingue · Tout le pays, une seule app"}
                {language === "de" && "Dreisprachig · Das ganze Land, eine App"}
                {language === "it" && "Trilingue · Tutto il paese, una sola app"}
              </div>
              <div className="text-xs text-gray-500">FR · DE · IT</div>
            </div>
            <div className="ml-4 w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 100 100" fill="white">
                <rect x="38" y="10" width="24" height="80" rx="4" />
                <rect x="10" y="38" width="80" height="24" rx="4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
