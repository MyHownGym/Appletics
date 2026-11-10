import { Instagram, Linkedin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/constants/translations";
import logoFull from "@/assets/logo-full.png";

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language].footer;

  return (
    <footer className="bg-gray-900 text-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logoFull} alt="Appletics" className="h-9 w-auto rounded-xl" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t.tagline}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg">🇨🇭</span>
              <span className="text-xs text-gray-500">{t.madeWith}</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-4 uppercase tracking-wider">
              {language === "fr" ? "Navigation" : language === "de" ? "Navigation" : "Navigazione"}
            </h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Fonctionnalités" : language === "de" ? "Funktionen" : "Funzionalità"}</a></li>
              <li><a href="#advantages" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Pourquoi Appletics" : language === "de" ? "Warum Appletics" : "Perché Appletics"}</a></li>
              <li><a href="#map" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Carte des clubs" : language === "de" ? "Vereinskarte" : "Mappa club"}</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Tarifs" : language === "de" ? "Preise" : "Prezzi"}</a></li>
              <li><a href="#founders" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Programme Fondateurs" : language === "de" ? "Gründerprogramm" : "Programma Fondatori"}</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a></li>
              <li><a href="/mentions-legales" className="text-gray-400 hover:text-white text-sm transition-colors">{language === "fr" ? "Mentions légales" : language === "de" ? "Impressum" : "Note legali"}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-4 uppercase tracking-wider">
              {t.social}
            </h4>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/appletics.ch"
                className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://linkedin.com/company/appletics"
                className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://tiktok.com/@appletics"
                className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors text-sm font-bold"
                target="_blank"
                rel="noopener noreferrer"
              >
                TK
              </a>
            </div>

            {/* Contact */}
            <div className="mt-6">
              <a
                href="mailto:contact@appletics.ch"
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
              >
                contact@appletics.ch
              </a>
            </div>
            <div className="mt-1">
              <a
                href="https://appletics.ch"
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
              >
                appletics.ch
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">{t.rights}</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>FR</span>
            <span>·</span>
            <span>DE</span>
            <span>·</span>
            <span>IT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
