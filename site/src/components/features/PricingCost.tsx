import { PRICING_COPY } from "@/constants/pricingCopy";
import { annualCost, annualSaving, formatCHF } from "@/lib/pricing";
import type { Language } from "@/constants/translations";
import type { BillingCycle, PricingPlan } from "@/types/pricing";

interface PricingCostProps { plan: PricingPlan; billing: BillingCycle; language: Language }
export default function PricingCost({ plan, billing, language }: PricingCostProps) {
  const t = PRICING_COPY[language];
  return <div className="mb-6 border-b border-border pb-6">
    <p className="pricing-value flex flex-wrap items-baseline gap-x-2"><span className="text-3xl font-bold tracking-tight">{formatCHF(plan.prices[billing], language)}</span><span className="pricing-subtle text-base">{billing === "annual_once" ? t.year : t.month}</span></p>
    <div className="pricing-subtle mt-3 text-base leading-relaxed">
      {billing === "monthly" ? <p>{t.billing.monthly.detail}</p> : <>
        <p className="font-semibold">{t.save} {formatCHF(annualSaving(plan, billing), language)} {t.saveSuffix}.</p>
        <p className="mt-2">{billing === "annual_once" ? t.onePayment : `${formatCHF(plan.prices[billing], language)} × 12 · ${t.annualTotal}`} : {formatCHF(annualCost(plan, billing), language)}</p>
      </>}
    </div>
  </div>;
}
