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
import { DAMAGE_TYPE_LABELS, SEVERITY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import { updateReport } from "@/lib/api/reports";
import type { DamageReport, SeverityLevel } from "@/lib/types";
import { SlideInUp, FadeIn, StaggerChildren, ScaleIn, HoverLift } from "@/components/animations";

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
      <SlideInUp duration={0.5}>
        <div className="space-y-6">
          <FadeIn duration={0.6}>
            <PageHeader
              title="Pending Reports"
              description="Review and verify AI-detected road damage reports."
            />
          </FadeIn>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
            </div>
          ) : pending.length === 0 ? (
            <FadeIn duration={0.4}>
              <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
                <p className="text-muted">No pending reports to review.</p>
              </div>
            </FadeIn>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <FadeIn duration={0.5} delay={0.1} className="space-y-2 lg:col-span-1">
                <StaggerChildren staggerDelay={0.08}>
                  {pending.map((r) => (
                    <HoverLift key={r.id}>
                      <button
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
                    </HoverLift>
                  ))}
                </StaggerChildren>
              </FadeIn>

              {report && (
                <FadeIn duration={0.5} delay={0.2} className="space-y-4 lg:col-span-2">
                  <ScaleIn duration={0.4}>
                    <Card>
                      <div className="relative h-64 w-full">
                        <Image src={report.imageUrl} alt="Report" fill className="rounded-t-xl object-cover" unoptimized />
                        <div className="absolute right-3 top-3">
                          <SeverityBadge severity={report.severity} />
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-lg font-semibold text-ink">
                            {DAMAGE_TYPE_LABELS[report.damageType]}
                          </h2>
                          <StatusBadge status={report.status} />
                        </div>
                        {report.priority && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              report.priority === "critical" || report.priority === "high"
                                ? "bg-danger text-white border-danger"
                                : report.priority === "medium"
                                ? "bg-warning text-white border-warning"
                                : "bg-success text-white border-success"
                            }`}>
                              {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                            </span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                          <MapPin className="h-4 w-4 text-accent-600" />
                          {report.location.address}, {report.location.city}
                        </div>
                        <p className="mt-1 text-xs text-muted/70">
                          Reported by {report.userName} on {formatDate(report.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </ScaleIn>

                  <ScaleIn duration={0.4} delay={0.1}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Brain className="h-4 w-4" />
                          AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <StaggerChildren staggerDelay={0.05}>
                          {report.aiDetections.map((d, i) => (
                            <HoverLift key={i}>
                              <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
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
                            </HoverLift>
                          ))}
                        </StaggerChildren>
                        <p className="text-sm text-ink-secondary">{report.aiExplanation}</p>
                        
                        <div className="mt-4 space-y-2 rounded-xl border border-line bg-surface-muted/30 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted">Protocol Followed</span>
                            <span className={`text-xs font-semibold ${report.protocolFollowed ? 'text-success' : 'text-danger'}`}>
                              {report.protocolFollowed ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {report.suggestedDepartment && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted">Suggested Department</span>
                              <span className="text-xs font-semibold text-ink">{report.suggestedDepartment}</span>
                            </div>
                          )}
                          {report.recommendedResponseTime && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted">Recommended Response</span>
                              <span className="text-xs font-semibold text-accent-600">{report.recommendedResponseTime}</span>
                            </div>
                          )}
                        </div>
                        
                        {report.complaintText && (
                          <div className="mt-3 rounded-xl border border-line bg-surface-muted/30 p-3">
                            <p className="text-xs font-semibold text-muted mb-1">Complaint Description</p>
                            <p className="text-sm text-ink-secondary">{report.complaintText}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ScaleIn>

                  <ScaleIn duration={0.4} delay={0.2}>
                    <Card>
                      <CardContent className="p-6">
                        <Select
                          id="severity"
                          label="Assign Severity"
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                          options={Object.entries(SEVERITY_LABELS).map(([value, label]) => ({ value, label }))}
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
                          <FadeIn duration={0.3}>
                            <p className="mt-3 text-sm font-medium text-success">
                              Report {actionTaken === "verify" ? "verified" : "rejected"} successfully.
                            </p>
                          </FadeIn>
                        )}
                      </CardContent>
                    </Card>
                  </ScaleIn>
                </FadeIn>
              )}
            </div>
          )}
        </div>
      </SlideInUp>
    </RoleGuard>
  );
}
