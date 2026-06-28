import { cn } from "@/lib/utils";
import type { ReportStatus, SeverityLevel } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

const statusStyles: Record<ReportStatus, string> = {
  reported: "bg-brand-50 text-brand-700 ring-brand-200",
  verified: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  assigned: "bg-purple-50 text-purple-800 ring-purple-200",
  in_progress: "bg-accent-50 text-accent-700 ring-accent-200",
  completed: "bg-success-soft text-success ring-emerald-200",
  rejected: "bg-danger-soft text-danger ring-red-200",
};

const severityStyles: Record<SeverityLevel, string> = {
  low: "bg-surface-muted text-ink-secondary ring-line",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  high: "bg-orange-50 text-orange-800 ring-orange-200",
  critical: "bg-danger-soft text-danger ring-red-200",
};

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge className={statusStyles[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <Badge className={cn(severityStyles[severity], "capitalize")}>
      {severity}
    </Badge>
  );
}
