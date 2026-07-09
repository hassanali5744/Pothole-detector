"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import type { ReportStatus, DamageType, DamageReport } from "@/lib/types";
import { STATUS_LABELS, DAMAGE_TYPE_LABELS } from "@/lib/constants";

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DamageType | "all">("all");
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.get("/api/reports", {
          params: { status: statusFilter, damageType: typeFilter },
        });
        setReports(mapReports(data as Record<string, unknown>[]));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter, typeFilter]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.damageType = typeFilter;
      
      const response = await apiClient.get("/api/reports/export/csv", { params });
      
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="All Reports"
          description="Manage and export all road damage reports."
        >
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </PageHeader>

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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} showUser />
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
