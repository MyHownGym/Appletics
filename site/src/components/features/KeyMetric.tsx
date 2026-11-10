import { Building2, Languages, Target, Users, type LucideIcon } from "lucide-react";
import type { KeyMetricData } from "@/constants/keyMetrics";

const METRIC_ICONS: Record<string, LucideIcon> = {
  clubs: Building2, members: Users, languages: Languages, goal: Target,
};

interface KeyMetricProps {
  metric: KeyMetricData;
  progress: number;
  formatter: Intl.NumberFormat;
}

export default function KeyMetric({ metric, progress, formatter }: KeyMetricProps) {
  const Icon = METRIC_ICONS[metric.id] ?? Target;
  return (
    <div data-scroll-reveal={metric.id === "members" || metric.isGoal ? "right" : "left"} className={`key-metric relative isolate flex min-w-0 flex-col overflow-hidden rounded-3xl p-4 sm:p-6 ${metric.isGoal ? "key-metric-goal" : ""}`}>
      <dt className="key-metric-label mt-3 text-base font-semibold leading-snug">
        <span aria-hidden="true" className="key-metric-icon absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl sm:left-6 sm:top-6">
          <Icon size={21} strokeWidth={1.75} />
        </span>
        {metric.label}
      </dt>
      <dd className="key-metric-value order-first mt-16 whitespace-nowrap text-[1.875rem] font-bold leading-none tracking-tight tabular-nums sm:text-4xl xl:text-[3.5rem]">
        <span className="sr-only">{formatter.format(metric.value)}</span>
        <span aria-hidden="true">{formatter.format(Math.round(metric.value * progress))}</span>
      </dd>
      {metric.detail && (
        <dd className={`key-metric-detail mt-4 pt-4 text-base leading-relaxed ${metric.isGoal ? "font-semibold" : ""}`}>
          {metric.detail}
        </dd>
      )}
    </div>
  );
}
