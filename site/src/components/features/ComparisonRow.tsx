import { BarChart2, Check, FolderOpen, Languages, MessageCircle, TriangleAlert, Trophy, X, type LucideIcon } from "lucide-react";

interface ComparisonRowProps {
  row: { icon: string; before: string; after: string };
  index: number;
  beforeLabel: string;
  afterLabel: string;
}

const COMPARISON_ICONS: Record<string, LucideIcon> = {
  "💬": MessageCircle, "📊": BarChart2, "📁": FolderOpen,
  "⚠️": TriangleAlert, "🌍": Languages, "🏆": Trophy,
};

export default function ComparisonRow({ row, index, beforeLabel, afterLabel }: ComparisonRowProps) {
  const Icon = COMPARISON_ICONS[row.icon] ?? MessageCircle;
  return (
    <div data-scroll-reveal={index % 2 === 0 ? "left" : "right"} className="comparison-row grid min-w-0 grid-cols-1 gap-2 rounded-2xl border border-border bg-background p-3 md:grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] md:gap-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
      <div aria-hidden="true" className="hidden items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm md:flex">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="comparison-cell comparison-before min-w-0 rounded-xl p-4 md:flex md:items-center md:gap-3">
        <div className="mb-2 flex shrink-0 items-center gap-2 md:mb-0">
          <span aria-hidden="true" className="comparison-status flex h-5 w-5 shrink-0 items-center justify-center rounded-full"><X size={13} strokeWidth={2.5} /></span>
          <span className="comparison-label text-sm font-semibold md:sr-only">{beforeLabel}</span>
        </div>
        <p className="comparison-text min-w-0 break-words text-base leading-relaxed [hyphens:auto] md:text-sm md:leading-snug md:line-through">{row.before}</p>
      </div>
      <div className="comparison-cell comparison-after min-w-0 rounded-xl p-4 md:flex md:items-center md:gap-3">
        <div className="mb-2 flex shrink-0 items-center gap-2 md:mb-0">
          <span aria-hidden="true" className="comparison-status flex h-5 w-5 shrink-0 items-center justify-center rounded-full"><Check size={13} strokeWidth={2.5} /></span>
          <span className="comparison-label text-sm font-semibold md:sr-only">{afterLabel}</span>
        </div>
        <p className="comparison-text min-w-0 break-words text-base font-medium leading-relaxed [hyphens:auto] md:text-sm md:leading-snug">{row.after}</p>
      </div>
    </div>
  );
}
