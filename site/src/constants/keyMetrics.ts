import type { Language } from "@/constants/translations";

export interface KeyMetricData {
  id: string;
  value: number;
  label: string;
  detail?: string;
  isGoal?: boolean;
}

interface KeyMetricsCopy {
  title: string;
  subtitle: string;
  metrics: KeyMetricData[];
}

export const KEY_METRICS_LOCALES: Record<Language, string> = {
  fr: "fr-CH", de: "de-CH", it: "it-CH",
};

export const KEY_METRICS_COPY: Record<Language, KeyMetricsCopy> = {
  fr: {
    title: "L’athlétisme suisse, en chiffres.",
    subtitle: "Un ancrage suisse. Une ambition commune pour les coachs et leurs athlètes.",
    metrics: [
      { id: "clubs", value: 524, label: "clubs en Suisse" },
      { id: "members", value: 37200, label: "membres actifs", detail: "Dans l’athlétisme suisse" },
      { id: "languages", value: 3, label: "langues", detail: "Français · Deutsch · Italiano" },
      { id: "goal", value: 300, label: "coachs en 3 mois", detail: "Objectif de lancement", isGoal: true },
    ],
  },
  de: {
    title: "Die Schweizer Leichtathletik in Zahlen.",
    subtitle: "In der Schweiz verwurzelt. Ein gemeinsames Ziel für Coaches und ihre Athleten.",
    metrics: [
      { id: "clubs", value: 524, label: "Vereine in der Schweiz" },
      { id: "members", value: 37200, label: "aktive Mitglieder", detail: "In der Schweizer Leichtathletik" },
      { id: "languages", value: 3, label: "Sprachen", detail: "Français · Deutsch · Italiano" },
      { id: "goal", value: 300, label: "Coaches in 3 Monaten", detail: "Ziel zum Start", isGoal: true },
    ],
  },
  it: {
    title: "L’atletica svizzera, in numeri.",
    subtitle: "Radici svizzere. Un’ambizione comune per i coach e i loro atleti.",
    metrics: [
      { id: "clubs", value: 524, label: "club in Svizzera" },
      { id: "members", value: 37200, label: "membri attivi", detail: "Nell’atletica svizzera" },
      { id: "languages", value: 3, label: "lingue", detail: "Français · Deutsch · Italiano" },
      { id: "goal", value: 300, label: "coach in 3 mesi", detail: "Obiettivo di lancio", isGoal: true },
    ],
  },
};
