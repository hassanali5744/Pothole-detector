import Image from "next/image";
import Link from "next/link";
import { MapPin, Brain, Clock } from "lucide-react";
import type { DamageReport } from "@/lib/types";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ReportCardProps {
  report: DamageReport;
  href?: string;
  showUser?: boolean;
}

export function ReportCard({ report, href, showUser = false }: ReportCardProps) {
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
        <div className="absolute right-3 top-3">
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
