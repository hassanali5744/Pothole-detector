"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { DamageMap } from "@/components/map/damage-map";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import type { DamageType, ReportStatus, DamageReport } from "@/lib/types";
import { DAMAGE_TYPE_LABELS, STATUS_LABELS, SEVERITY_LABELS } from "@/lib/constants";

export default function MapPage() {
  const [filterType, setFilterType] = useState<DamageType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/reports");
        setReports(mapReports(data as Record<string, unknown>[]));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <RoleGuard allowedRoles={["citizen", "inspector", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Damage Map"
          description="Interactive map showing road damage locations, repair sites, and high-risk areas."
        />

        <div className="flex flex-wrap gap-4 rounded-xl border border-line bg-surface p-4">
          <Select
            id="type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DamageType | "all")}
            options={[
              { value: "all", label: "All Damage Types" },
              ...Object.entries(DAMAGE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            id="status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | "all")}
            options={[
              { value: "all", label: "All Statuses" },
              ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-5 rounded-xl border border-line bg-surface-muted/50 px-4 py-3 text-xs">
          {Object.entries(SEVERITY_LABELS).map(([severity, label]) => {
            const colorMap: Record<string, string> = {
              low: "#7a7268",
              medium: "#b87333", 
              high: "#c17f3a",
              critical: "#9b2c2c"
            };
            return (
              <div key={severity} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: colorMap[severity] }} />
                <span className="font-medium text-ink-secondary">{label} Severity</span>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex h-[600px] items-center justify-center rounded-xl border border-line">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <DamageMap
            reports={reports}
            height="600px"
            filterType={filterType}
            filterStatus={filterStatus}
          />
        )}
      </div>
    </RoleGuard>
  );
}
