import Image from "next/image";
import Link from "next/link";
import { MapPin, Brain, Clock, AlertTriangle } from "lucide-react";
import type { DamageReport } from "@/lib/types";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ReportCardProps {
  report: DamageReport;
  href?: string;
  showUser?: boolean;
  showPriority?: boolean;
}

function getPriorityBadge(priority: string | undefined) {
  if (!priority) return null;
  
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  const isCritical = priority.toLowerCase() === "critical";
  const isHigh = priority.toLowerCase() === "high";
  const isMedium = priority.toLowerCase() === "medium";
  const isLow = priority.toLowerCase() === "low";
  
  let className = "bg-success text-white border-success";
  let showIcon = false;
  
  if (isCritical || isHigh) {
    className = isCritical ? "bg-danger text-white border-danger" : "bg-danger/90 text-white border-danger";
    showIcon = true;
  } else if (isMedium) {
    className = "bg-warning text-white border-warning";
  }
  
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {showIcon && <AlertTriangle className="h-3 w-3" />}
      <span>{priorityLabel} Priority</span>
    </div>
  );
}

export function ReportCard({ report, href, showUser = false, showPriority = false }: ReportCardProps) {
  const content = (
    <Card className="group overflow-hidden transition-all duration-200 hover:border-line-strong hover:shadow-[var(--shadow-card)]">
      <div className="relative h-44 w-full bg-surface-muted">
        <Image
          src={report.imageUrl}
          alt={`${DAMAGE_TYPE_LABELS[report.damageType]} report`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col gap-2 items-end">
          {showPriority && report.priority && getPriorityBadge(report.priority)}
          <SeverityBadge severity={report.severity} />
        </div>
      </div>
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-ink">
            {DAMAGE_TYPE_LABELS[report.damageType]}
          </h3>
          <StatusBadge status={report.status} />
        </div>
        <div className="space-y-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent-600" />
            <span className="truncate">{report.location.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span>AI Confidence: {(report.aiConfidence * 100).toFixed(0)}%</span>
          </div>
          {report.severityPercentage && (
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span>Severity Score: {report.severityPercentage.toFixed(0)}%</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
          {showUser && (
            <p className="text-xs text-muted/80">Reported by {report.userName}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
