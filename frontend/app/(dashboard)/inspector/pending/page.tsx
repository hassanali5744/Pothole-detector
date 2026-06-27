"use client";

import { useState } from "react";
import Image from "next/image";
import { Brain, MapPin, Check, X } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Reports</h1>
          <p className="text-slate-500">Review and verify AI-detected road damage reports.</p>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">No pending reports to review.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              {pending.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r.id); setSeverity(r.severity); }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected === r.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">
                    {DAMAGE_TYPE_LABELS[r.damageType]}
                  </p>
                  <p className="text-xs text-slate-500">{r.location.address}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
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
                      <h2 className="text-lg font-semibold text-slate-900">
                        {DAMAGE_TYPE_LABELS[report.damageType]}
                      </h2>
                      <StatusBadge status={report.status} />
                      <SeverityBadge severity={report.severity} />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {report.location.address}, {report.location.city}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
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
                      <div key={i} className="rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {DAMAGE_TYPE_LABELS[d.damageType]}
                          </span>
                          <span className="text-xs text-brand-600">
                            {(d.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{d.explanation}</p>
                      </div>
                    ))}
                    <p className="text-sm text-slate-600">{report.aiExplanation}</p>
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
                      <p className="mt-3 text-sm text-emerald-600">
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
