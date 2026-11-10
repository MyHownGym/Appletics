
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations, type Language } from "@/constants/translations";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "it", label: "IT", flag: "🇮🇹" },
];

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language].nav;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t.features, href: "#features" },
    { label: t.testimonials, href: "#testimonials" },
    { label: t.pricing, href: "#pricing" },
    { label: language === "fr" ? "Fondateurs" : language === "de" ? "Gründer" : "Fondatori", href: "#founders" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img
              src={scrolled ? logoFull : logoIcon}
              alt="Appletics"
              className="h-9 w-auto group-hover:scale-105 transition-transform rounded-xl"
            />
            {/* Swiss badge */}
            <span className="hidden sm:flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5">
              🇨🇭 <span className="hidden md:inline">{t.madeIn}</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                  scrolled ? "text-gray-600" : "text-white/80"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-0.5 border border-white/20 gap-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    language === lang.code
                      ? "bg-primary-500 text-white shadow-sm"
                      : scrolled
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Web app */}
            <a
              href="https://app.appletics.ch" target="_blank" rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center text-sm font-semibold px-3 py-2 rounded-full transition-colors ${scrolled ? "text-gray-700 hover:text-primary-500" : "text-white hover:text-white/80"}`}
            >
              {t.openApp}
            </a>

            {/* CTA */}
            <a
              href="#founders-form"
              className="hidden sm:inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {t.download}
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-gray-700" : "text-white"}`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary-500 hover:bg-orange-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://app.appletics.ch" target="_blank" rel="noopener noreferrer"
              className="block px-4 py-3 text-sm font-semibold text-primary-500 hover:bg-orange-50 rounded-lg"
            >
              {t.openApp}
            </a>
            <a
              href="#founders-form"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 text-center bg-primary-500 text-white text-sm font-semibold px-4 py-3 rounded-xl"
            >
              {t.download}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
