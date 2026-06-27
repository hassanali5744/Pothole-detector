import { cn } from "@/lib/utils";
import type { ReportStatus, SeverityLevel } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

const statusStyles: Record<ReportStatus, string> = {
  reported: "bg-blue-50 text-blue-700 ring-blue-600/20",
  verified: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  assigned: "bg-purple-50 text-purple-700 ring-purple-600/20",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const severityStyles: Record<SeverityLevel, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
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
    <Badge className={cn(severityStyles[severity], "capitalize ring-0")}>
      {severity}
    </Badge>
  );
}
