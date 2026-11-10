export type PlanType = "coach" | "club";
export type BillingCycle = "monthly" | "annual_monthly" | "annual_once";
export type PlanName = "Basic" | "Pro" | "Elite";
export type CapacityKey = "coaches" | "athletes" | "plans" | "competitions" | "discussions";
export type FeatureKey = "calendar" | "records" | "history" | "charts" | "seasons" | "team" | "pdf" | "dashboard";
export type Limit = number | "unlimited";
export interface PricingPlan {
  name: PlanName;
  prices: Record<BillingCycle, number>;
  capacities: Partial<Record<CapacityKey, Limit>>;
  features: Partial<Record<FeatureKey, boolean | null>>;
  pendingCoaches?: boolean;
  plannedCommittee?: number;
}
export interface PricingLabels {
  capacities: Record<CapacityKey, string>;
  features: Record<FeatureKey, string>;
  included: string;
  excluded: string;
  unlimited: string;
  pending: string;
  details: string;
  common: string;
  quotas: string;
  committee: string;
  pendingCoaches: string;
}
