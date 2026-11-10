import { CheckCircle2, CircleHelp, MinusCircle } from "lucide-react";
import { PRICING_LABELS } from "@/constants/pricingLabels";
import type { Language } from "@/constants/translations";
import type { FeatureKey } from "@/types/pricing";

interface PlanFeatureRowProps { feature: FeatureKey; status: boolean | null; language: Language }
export default function PlanFeatureRow({ feature, status, language }: PlanFeatureRowProps) {
  const t = PRICING_LABELS[language];
  const Icon = status === null ? CircleHelp : status ? CheckCircle2 : MinusCircle;
  return <li className="border-t border-border py-3">
    <div className="flex items-start gap-2"><Icon size={18} aria-hidden="true" className="mt-1 shrink-0" /><span className="text-base leading-snug">{t.features[feature]}</span></div>
    <span className={`pricing-subtle ml-6 mt-1 block text-sm ${status ? "font-semibold" : ""}`}>{status === null ? t.pending : status ? t.included : t.excluded}</span>
  </li>;
}
