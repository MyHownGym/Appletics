import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICING_PLANS } from "@/constants/pricingPlans";
import { PRICING_COPY } from "@/constants/pricingCopy";
import { PRICING_LABELS } from "@/constants/pricingLabels";
import PricingControls from "@/components/features/PricingControls";
import PricingCard from "@/components/features/PricingCard";
import PricingFoundersBanner from "@/components/features/PricingFoundersBanner";
import type { BillingCycle, PlanType } from "@/types/pricing";
import "@/styles/pricing.css";

export default function Pricing() {
  const { language } = useLanguage();
  const [planType, setPlanType] = useState<PlanType>("coach");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const t = PRICING_COPY[language];
  const labels = PRICING_LABELS[language];
  return <section id="pricing" className="pricing-section bg-background py-20 lg:py-28" aria-labelledby="pricing-title">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header data-scroll-reveal="right" className="mx-auto mb-10 max-w-2xl text-center">
        <span className="pricing-value mb-4 inline-block rounded-full bg-secondary px-4 py-2 text-sm font-semibold">{t.badge}</span>
        <h2 id="pricing-title" className="mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{t.title}</h2>
        <p className="pricing-subtle text-lg leading-relaxed">{t.subtitle}</p>
      </header>
      <PricingControls language={language} planType={planType} billing={billing} onPlanType={setPlanType} onBilling={setBilling} />
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
        {PRICING_PLANS[planType].map((plan, index) => <PricingCard key={`${planType}-${plan.name}`} plan={plan} planType={planType} billing={billing} language={language} index={index} />)}
      </div>
      <div className="mx-auto mt-8 max-w-4xl text-center">
        <p className="font-medium leading-relaxed">{labels.common}</p>
        <p className="pricing-subtle mt-3 text-base leading-relaxed">{labels.quotas}</p>
      </div>
      <div className="mx-auto max-w-6xl"><PricingFoundersBanner language={language} /></div>
    </div>
  </section>;
}
