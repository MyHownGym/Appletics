import { ArrowRight, Star } from "lucide-react";
import { OFFER_COPY } from "@/constants/offers";
import { PRICING_COPY } from "@/constants/pricingCopy";
import type { Language } from "@/constants/translations";

interface PricingFoundersBannerProps { language: Language }
export default function PricingFoundersBanner({ language }: PricingFoundersBannerProps) {
  const t = PRICING_COPY[language];
  return <aside data-scroll-reveal="left" className="pricing-founders mt-12 flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
    <div><h3 className="flex items-center gap-2 text-lg font-bold"><Star size={18} aria-hidden="true" />{t.foundersTitle}</h3><p className="pricing-subtle mt-2 text-base">{OFFER_COPY[language].founders}</p></div>
    <a href="#founders-form" className="pricing-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-semibold">{t.foundersLink}<ArrowRight size={18} aria-hidden="true" /></a>
  </aside>;
}
