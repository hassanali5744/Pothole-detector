"use client";

import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { Select } from "@/components/ui/select";
import { mockReports } from "@/lib/mock-data";
import type { ReportStatus, DamageType } from "@/lib/types";
import { STATUS_LABELS, DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { useState } from "react";

export default function CitizenReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DamageType | "all">("all");

  const filtered = mockReports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.damageType !== typeFilter) return false;
    return true;
  });

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="space-y-6">
        <PageHeader
          title="My Reports"
          description="View and track all your submitted road damage reports."
        />

        <div className="flex flex-wrap gap-4 rounded-xl border border-line bg-surface p-4">
          <Select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "all")}
            options={[
              { value: "all", label: "All Statuses" },
              ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            id="type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DamageType | "all")}
            options={[
              { value: "all", label: "All Damage Types" },
              ...Object.entries(DAMAGE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
            <p className="text-muted">No reports match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
