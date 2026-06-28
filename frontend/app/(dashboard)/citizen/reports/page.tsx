"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ReportStatus, DamageType, DamageReport } from "@/lib/types";
import { STATUS_LABELS, DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { mapReports } from "@/lib/mappers";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth-store";

export default function CitizenReportsPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DamageType | "all">("all");
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError("");
      try {
        const data = await apiClient.get("/api/reports", {
          params: {
            status: statusFilter,
            damageType: typeFilter,
          },
        });
        setReports(mapReports(data as Record<string, unknown>[]));
      } catch (err: any) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchReports();
    }
  }, [user, statusFilter, typeFilter]);

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

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-danger-soft p-6 text-center text-danger">
            <p>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
            <p className="text-muted">No reports match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

