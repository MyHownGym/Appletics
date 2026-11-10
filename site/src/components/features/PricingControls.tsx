import { UserCheck, Users } from "lucide-react";
import { PRICING_COPY } from "@/constants/pricingCopy";
import type { Language } from "@/constants/translations";
import type { BillingCycle, PlanType } from "@/types/pricing";

interface PricingControlsProps {
  language: Language; planType: PlanType; billing: BillingCycle;
  onPlanType: (value: PlanType) => void; onBilling: (value: BillingCycle) => void;
}
const CYCLES: BillingCycle[] = ["monthly", "annual_monthly", "annual_once"];
export default function PricingControls({ language, planType, billing, onPlanType, onBilling }: PricingControlsProps) {
  const t = PRICING_COPY[language];
  return (
    <div className="mb-12 space-y-6">
      <div className="flex justify-center" role="group" aria-label={language === "fr" ? "Type de formule" : language === "de" ? "Abo-Typ" : "Tipo di piano"}>
        <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
          {(["coach", "club"] as PlanType[]).map((type) => {
            const Icon = type === "coach" ? UserCheck : Users;
            return <button type="button" key={type} aria-pressed={planType === type} onClick={() => onPlanType(type)} className="pricing-select flex min-h-11 items-center gap-2 rounded-full px-6 font-semibold"><Icon size={18} />{t.audience[type]}</button>;
          })}
        </div>
      </div>
      <div role="group" aria-label={t.billingLabel} className="mx-auto grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
        {CYCLES.map((cycle) => <button type="button" key={cycle} aria-pressed={billing === cycle} onClick={() => onBilling(cycle)} className="pricing-select flex min-h-16 flex-col items-center justify-center rounded-xl border border-border px-4 py-3"><span className="font-semibold">{t.billing[cycle].title}</span><span className="text-sm">{t.billing[cycle].detail}</span></button>)}
      </div>
    </div>
  );
}
