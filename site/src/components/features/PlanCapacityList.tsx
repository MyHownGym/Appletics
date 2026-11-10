import { PRICING_LABELS } from "@/constants/pricingLabels";
import { CAPACITY_ORDER } from "@/lib/pricing";
import type { Language } from "@/constants/translations";
import type { PricingPlan } from "@/types/pricing";

interface PlanCapacityListProps { plan: PricingPlan; language: Language }
export default function PlanCapacityList({ plan, language }: PlanCapacityListProps) {
  const t = PRICING_LABELS[language];
  return <dl className="mb-6 divide-y divide-border">
    {CAPACITY_ORDER.filter((key) => plan.capacities[key] !== undefined).map((key) => <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
      <dt className="pricing-subtle text-base leading-snug">{t.capacities[key]}</dt>
      <dd className={`pricing-value font-bold ${key === "athletes" ? "text-2xl" : "text-lg"}`}>{plan.capacities[key] === "unlimited" ? t.unlimited : plan.capacities[key]}{key === "coaches" && plan.pendingCoaches && <span aria-label={t.pending} title={t.pendingCoaches}>*</span>}</dd>
    </div>)}
  </dl>;
}
