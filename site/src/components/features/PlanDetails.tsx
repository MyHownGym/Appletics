import { ChevronDown } from "lucide-react";
import { PRICING_LABELS } from "@/constants/pricingLabels";
import { FEATURE_ORDER } from "@/lib/pricing";
import PlanFeatureRow from "@/components/features/PlanFeatureRow";
import type { Language } from "@/constants/translations";
import type { PricingPlan } from "@/types/pricing";

interface PlanDetailsProps { plan: PricingPlan; language: Language }
export default function PlanDetails({ plan, language }: PlanDetailsProps) {
  const t = PRICING_LABELS[language];
  return <details className="pricing-details mb-6 border-y border-border">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 py-3 text-base font-semibold">{t.details}<ChevronDown size={18} aria-hidden="true" className="shrink-0" /></summary>
    <ul className="pb-2">{FEATURE_ORDER.map((feature) => {
      const status = plan.features[feature];
      return status === undefined ? null : <PlanFeatureRow key={feature} feature={feature} status={status} language={language} />;
    })}</ul>
    {plan.plannedCommittee && <p className="pricing-subtle mb-4 text-base leading-relaxed">{t.committee}</p>}
    {plan.pendingCoaches && <p className="pricing-subtle mb-4 text-base leading-relaxed">* {t.pendingCoaches}</p>}
  </details>;
}
