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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-slate-100">
        <Image
          src={report.imageUrl}
          alt={`${DAMAGE_TYPE_LABELS[report.damageType]} report`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute right-2 top-2">
          <SeverityBadge severity={report.severity} />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900">
            {DAMAGE_TYPE_LABELS[report.damageType]}
          </h3>
          <StatusBadge status={report.status} />
        </div>
        <div className="space-y-1.5 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{report.location.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 shrink-0" />
            <span>AI Confidence: {(report.aiConfidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
          {showUser && (
            <p className="text-xs text-slate-400">Reported by {report.userName}</p>
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
