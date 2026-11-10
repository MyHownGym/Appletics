import { Star } from "lucide-react";
import { OFFER_COPY } from "@/constants/offers";
import { PRICING_COPY } from "@/constants/pricingCopy";
import PlanCapacityList from "@/components/features/PlanCapacityList";
import PlanDetails from "@/components/features/PlanDetails";
import PricingCost from "@/components/features/PricingCost";
import type { Language } from "@/constants/translations";
import type { BillingCycle, PlanType, PricingPlan } from "@/types/pricing";

interface PricingCardProps { plan: PricingPlan; planType: PlanType; billing: BillingCycle; language: Language; index: number }
export default function PricingCard({ plan, planType, billing, language, index }: PricingCardProps) {
  const t = PRICING_COPY[language];
  const featured = plan.name === "Pro";
  return <article data-scroll-reveal={index % 2 ? "right" : "left"} className={`pricing-card relative flex h-full min-w-0 flex-col rounded-2xl border p-6 lg:p-8 ${featured ? "is-featured" : ""}`}>
    {featured && <span className="pricing-popular absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"><Star size={14} aria-hidden="true" />{t.popular}</span>}
    <header className="mb-6 pt-2">
      <h3 className="text-2xl font-bold">{planType === "club" ? `${t.audience.club} ${plan.name}` : plan.name}</h3>
      <p className="pricing-subtle mt-2 text-base leading-relaxed">{t.descriptions[planType][index]}</p>
    </header>
    <PricingCost plan={plan} billing={billing} language={language} />
    <PlanCapacityList plan={plan} language={language} />
    <PlanDetails plan={plan} language={language} />
    <a href="#download" className={`pricing-cta mt-auto inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-center text-base font-semibold ${featured ? "is-primary" : ""}`}>{OFFER_COPY[language].trial}</a>
  </article>;
}
