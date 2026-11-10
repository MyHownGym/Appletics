import { createContext, useContext, useState, ReactNode } from "react";
import type { Language } from "@/constants/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("appletics-lang");
    if (saved === "fr" || saved === "de" || saved === "it") return saved;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("de")) return "de";
    if (browserLang.startsWith("it")) return "it";
    return "fr";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("appletics-lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
