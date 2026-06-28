"use client";

import { useState } from "react";
import Image from "next/image";
import { Brain, MapPin, Check, X } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { mockReports } from "@/lib/mock-data";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { SeverityLevel } from "@/lib/types";

export default function PendingReportsPage() {
  const pending = mockReports.filter((r) => r.status === "reported");
  const [selected, setSelected] = useState(pending[0]?.id ?? "");
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const report = pending.find((r) => r.id === selected);

  const handleAction = (action: "verify" | "reject") => {
    setActionTaken(action);
    setTimeout(() => setActionTaken(null), 3000);
  };

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-6">
        <PageHeader
          title="Pending Reports"
          description="Review and verify AI-detected road damage reports."
        />

        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
            <p className="text-muted">No pending reports to review.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              {pending.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r.id); setSeverity(r.severity); }}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    selected === r.id
                      ? "border-brand-700 bg-brand-800 text-white shadow-[0_2px_8px_rgba(12,25,41,0.2)]"
                      : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted"
                  }`}
                >
                  <p className={`text-sm font-semibold ${selected === r.id ? "text-white" : "text-ink"}`}>
                    {DAMAGE_TYPE_LABELS[r.damageType]}
                  </p>
                  <p className={`text-xs ${selected === r.id ? "text-brand-100" : "text-muted"}`}>{r.location.address}</p>
                  <p className={`mt-1 text-xs ${selected === r.id ? "text-brand-200/70" : "text-muted/70"}`}>{formatDate(r.createdAt)}</p>
                </button>
              ))}
            </div>

            {report && (
              <div className="space-y-4 lg:col-span-2">
                <Card>
                  <div className="relative h-64 w-full">
                    <Image
                      src={report.imageUrl}
                      alt="Report"
                      fill
                      className="rounded-t-xl object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink">
                        {DAMAGE_TYPE_LABELS[report.damageType]}
                      </h2>
                      <StatusBadge status={report.status} />
                      <SeverityBadge severity={report.severity} />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="h-4 w-4 text-accent-600" />
                      {report.location.address}, {report.location.city}
                    </div>
                    <p className="mt-1 text-xs text-muted/70">
                      Reported by {report.userName} on {formatDate(report.createdAt)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.aiDetections.map((d, i) => (
                      <div key={i} className="rounded-xl border border-line bg-surface-muted/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">
                            {DAMAGE_TYPE_LABELS[d.damageType]}
                          </span>
                          <span className="text-xs font-semibold text-accent-600">
                            {(d.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{d.explanation}</p>
                      </div>
                    ))}
                    <p className="text-sm text-ink-secondary">{report.aiExplanation}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <Select
                      id="severity"
                      label="Assign Severity"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                      options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                        { value: "critical", label: "Critical" },
                      ]}
                    />
                    <div className="mt-4 flex gap-3">
                      <Button onClick={() => handleAction("verify")}>
                        <Check className="h-4 w-4" />
                        Verify Report
                      </Button>
                      <Button variant="danger" onClick={() => handleAction("reject")}>
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                    {actionTaken && (
                      <p className="mt-3 text-sm font-medium text-success">
                        Report {actionTaken === "verify" ? "verified" : "rejected"} successfully.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
