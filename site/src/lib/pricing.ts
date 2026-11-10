import type { Language } from "@/constants/translations";
import type { BillingCycle, CapacityKey, FeatureKey, PricingPlan } from "@/types/pricing";

export const CAPACITY_ORDER: CapacityKey[] = ["coaches", "athletes", "plans", "competitions", "discussions"];
export const FEATURE_ORDER: FeatureKey[] = ["calendar", "records", "history", "charts", "seasons", "team", "pdf", "dashboard"];
const LOCALES = { fr: "fr-CH", de: "de-CH", it: "it-CH" };
export function formatCHF(value: number, language: Language) {
  return `CHF ${new Intl.NumberFormat(LOCALES[language], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}
export function annualCost(plan: PricingPlan, billing: BillingCycle) {
  return billing === "annual_once" ? plan.prices.annual_once : plan.prices[billing] * 12;
}
export function annualSaving(plan: PricingPlan, billing: BillingCycle) {
  return Math.round((plan.prices.monthly * 12 - annualCost(plan, billing)) * 100) / 100;
}
