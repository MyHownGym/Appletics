import type { PricingPlan, PlanType } from "@/types/pricing";

const BASIC_FEATURES = { calendar: true, records: true, history: true, charts: false, seasons: false, team: false, pdf: false };
const PRO_FEATURES = { ...BASIC_FEATURES, charts: true };
const ELITE_FEATURES = { calendar: true, records: true, history: true, charts: true, seasons: true, team: true, pdf: true };

// Numeric limits come from the supplied app screenshots. Club Pro's coach
// count is retained from the existing site and explicitly marked unconfirmed.
export const PRICING_PLANS: Record<PlanType, PricingPlan[]> = {
  coach: [
    { name: "Basic", prices: { monthly: 5.9, annual_monthly: 3.9, annual_once: 39 },
      capacities: { athletes: 5, plans: 3, competitions: 5, discussions: 1 }, features: BASIC_FEATURES },
    { name: "Pro", prices: { monthly: 9.9, annual_monthly: 7.9, annual_once: 79 },
      capacities: { athletes: 25, plans: 15, competitions: 20, discussions: 5 },
      features: { ...PRO_FEATURES, pdf: null } },
    { name: "Elite", prices: { monthly: 19.9, annual_monthly: 15.9, annual_once: 159 },
      capacities: { athletes: "unlimited", plans: "unlimited", competitions: "unlimited", discussions: "unlimited" },
      features: ELITE_FEATURES },
  ],
  club: [
    { name: "Basic", prices: { monthly: 29.9, annual_monthly: 24.9, annual_once: 249 },
      capacities: { coaches: 2, athletes: 50, plans: 10, competitions: 15, discussions: 3 },
      features: { ...BASIC_FEATURES, dashboard: true }, plannedCommittee: 1 },
    { name: "Pro", prices: { monthly: 59.9, annual_monthly: 49.9, annual_once: 499 },
      capacities: { coaches: 5, athletes: 150, plans: 40, competitions: 50, discussions: 10 },
      features: { ...PRO_FEATURES, pdf: true, dashboard: true }, pendingCoaches: true },
    { name: "Elite", prices: { monthly: 99.9, annual_monthly: 79.9, annual_once: 799 },
      capacities: { coaches: "unlimited", athletes: "unlimited", plans: "unlimited", competitions: "unlimited", discussions: "unlimited" },
      features: { ...ELITE_FEATURES, dashboard: true } },
  ],
};
