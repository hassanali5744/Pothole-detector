"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Brain, MapPin, Check, X, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import { updateReport } from "@/lib/api/reports";
import type { DamageReport, SeverityLevel } from "@/lib/types";

export default function PendingReportsPage() {
  const [pending, setPending] = useState<DamageReport[]>([]);
  const [selected, setSelected] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [actionTaken, setActionTaken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/reports", { params: { status: "reported" } });
        const list = mapReports(data as Record<string, unknown>[]);
        setPending(list);
        if (list.length > 0) {
          setSelected(list[0].id);
          setSeverity(list[0].severity);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const report = pending.find((r) => r.id === selected);

  const handleAction = async (action: "verify" | "reject") => {
    if (!report) return;
    setActing(true);
    try {
      await updateReport(report.id, {
        status: action === "verify" ? "verified" : "rejected",
        severity,
      });
      setPending((prev) => prev.filter((r) => r.id !== report.id));
      setActionTaken(action);
      setTimeout(() => setActionTaken(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-6">
        <PageHeader
          title="Pending Reports"
          description="Review and verify AI-detected road damage reports."
        />

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : pending.length === 0 ? (
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
                    <Image src={report.imageUrl} alt="Report" fill className="rounded-t-xl object-cover" unoptimized />
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
                      <Button onClick={() => handleAction("verify")} disabled={acting}>
                        <Check className="h-4 w-4" />
                        {acting ? "Processing..." : "Verify Report"}
                      </Button>
                      <Button variant="danger" onClick={() => handleAction("reject")} disabled={acting}>
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
