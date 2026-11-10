import { useMemo } from "react";
import KeyMetric from "@/components/features/KeyMetric";
import { KEY_METRICS_COPY, KEY_METRICS_LOCALES } from "@/constants/keyMetrics";
import { useLanguage } from "@/hooks/useLanguage";
import { useScrollCounter } from "@/hooks/useScrollCounter";

export default function KeyMetrics() {
  const { language } = useLanguage();
  const { sectionRef, progress } = useScrollCounter();
  const copy = KEY_METRICS_COPY[language];
  const formatter = useMemo(
    () => new Intl.NumberFormat(KEY_METRICS_LOCALES[language], { maximumFractionDigits: 0 }),
    [language],
  );

  return (
    <section id="chiffres-cles" ref={sectionRef} lang={language} aria-labelledby="key-metrics-title" className="key-figures relative isolate overflow-hidden py-16 lg:py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header data-scroll-reveal="left" className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <span aria-hidden="true" className="key-figures-rule mb-6 block h-1 w-12 rounded-full" />
            <h2 id="key-metrics-title" className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {copy.title}
            </h2>
          </div>
          <p className="key-figures-subtitle max-w-sm text-base leading-relaxed">{copy.subtitle}</p>
        </header>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {copy.metrics.map((metric) => (
            <KeyMetric key={metric.id} metric={metric} progress={progress} formatter={formatter} />
          ))}
        </dl>
      </div>
    </section>
  );
}
