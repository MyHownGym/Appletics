import type { Language } from "@/constants/translations";

interface OfferCopy {
  trial: string;
  trialNote: string;
  founders: string;
  foundersDuration: string;
}

export const OFFER_COPY: Record<Language, OfferCopy> = {
  fr: {
    trial: "Essayer 30 jours gratuitement",
    trialNote: "30 jours gratuits sur toutes les formules coachs et clubs.",
    founders: "6 mois de formule Premium offerts",
    foundersDuration: "L’avantage Premium est offert pendant 6 mois, et non à vie.",
  },
  de: {
    trial: "30 Tage kostenlos testen",
    trialNote: "30 Tage gratis für alle Coach- und Vereinsabos.",
    founders: "6 Monate Premium gratis",
    foundersDuration: "Der Premium-Vorteil gilt für 6 Monate, nicht lebenslang.",
  },
  it: {
    trial: "Prova gratis per 30 giorni",
    trialNote: "30 giorni gratis per tutti i piani coach e club.",
    founders: "6 mesi di Premium in regalo",
    foundersDuration: "Il vantaggio Premium è gratuito per 6 mesi, non a vita.",
  },
};
