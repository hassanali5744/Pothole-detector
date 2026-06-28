import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-line-strong hover:shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-accent-500 to-brand-600 opacity-80" />
      <div className="flex items-start justify-between pt-1">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</p>
          <p className="font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
          {description && (
            <p className="text-xs text-muted">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-semibold",
                trend.positive ? "text-success" : "text-danger"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-accent-50 p-3 ring-1 ring-accent-100 transition-colors group-hover:bg-accent-100">
          <Icon className="h-5 w-5 text-accent-600" />
        </div>
      </div>
    </div>
  );
}
