import type { Language } from "@/constants/translations";
import type { BillingCycle, PlanType } from "@/types/pricing";

interface PricingCopy {
  badge: string; title: string; subtitle: string; audience: Record<PlanType, string>;
  billingLabel: string; billing: Record<BillingCycle, { title: string; detail: string }>;
  descriptions: Record<PlanType, string[]>; popular: string; month: string; year: string;
  save: string; saveSuffix: string; annualTotal: string; onePayment: string;
  foundersTitle: string; foundersLink: string;
}
export const PRICING_COPY: Record<Language, PricingCopy> = {
  fr: {
    badge: "Tarifs", title: "La formule adaptée à votre équipe", subtitle: "30 jours gratuits sur toutes les formules coachs et clubs. Pas de carte bancaire requise.",
    audience: { coach: "Coachs", club: "Clubs" }, billingLabel: "Mode de paiement",
    billing: { monthly: { title: "Mensuel", detail: "Sans engagement" }, annual_monthly: { title: "12 mois", detail: "Paiement mensuel" }, annual_once: { title: "Annuel", detail: "En une fois" } },
    descriptions: { coach: ["Les essentiels pour commencer", "Structurer votre groupe et suivre chaque athlète", "Piloter la performance sans limite de volume"], club: ["Organiser une petite structure", "Accompagner un club en développement", "Piloter un grand club"] },
    popular: "Le bon équilibre", month: "/mois", year: "/an", save: "Économisez", saveSuffix: "par an par rapport au mensuel", annualTotal: "Total annuel", onePayment: "Un paiement annuel",
    foundersTitle: "Coachs & Clubs Fondateurs", foundersLink: "Rejoindre le programme",
  },
  de: {
    badge: "Preise", title: "Das passende Abo für Ihr Team", subtitle: "30 Tage gratis für alle Coach- und Vereinsabos. Keine Kreditkarte erforderlich.",
    audience: { coach: "Coaches", club: "Vereine" }, billingLabel: "Zahlungsweise",
    billing: { monthly: { title: "Monatlich", detail: "Ohne Bindung" }, annual_monthly: { title: "12 Monate", detail: "Monatliche Zahlung" }, annual_once: { title: "Jährlich", detail: "Einmalzahlung" } },
    descriptions: { coach: ["Das Wesentliche für den Start", "Ihre Gruppe strukturieren und jeden Athleten begleiten", "Leistung ohne Mengenbegrenzung steuern"], club: ["Einen kleinen Verein organisieren", "Einen wachsenden Verein begleiten", "Einen grossen Verein führen"] },
    popular: "Die richtige Balance", month: "/Monat", year: "/Jahr", save: "Sparen Sie", saveSuffix: "pro Jahr gegenüber monatlicher Zahlung", annualTotal: "Jahrestotal", onePayment: "Eine jährliche Zahlung",
    foundersTitle: "Gründer-Coaches & Gründer-Vereine", foundersLink: "Am Programm teilnehmen",
  },
  it: {
    badge: "Prezzi", title: "Il piano adatto alla tua squadra", subtitle: "30 giorni gratis per tutti i piani coach e club. Nessuna carta di credito richiesta.",
    audience: { coach: "Coach", club: "Club" }, billingLabel: "Modalità di pagamento",
    billing: { monthly: { title: "Mensile", detail: "Senza impegno" }, annual_monthly: { title: "12 mesi", detail: "Pagamento mensile" }, annual_once: { title: "Annuale", detail: "In una volta" } },
    descriptions: { coach: ["L’essenziale per iniziare", "Organizzare il gruppo e seguire ogni atleta", "Gestire le prestazioni senza limiti di volume"], club: ["Organizzare una piccola struttura", "Accompagnare un club in crescita", "Gestire un grande club"] },
    popular: "Il giusto equilibrio", month: "/mese", year: "/anno", save: "Risparmia", saveSuffix: "all’anno rispetto al mensile", annualTotal: "Totale annuo", onePayment: "Un pagamento annuale",
    foundersTitle: "Coach e Club Fondatori", foundersLink: "Unirsi al programma",
  },
};
