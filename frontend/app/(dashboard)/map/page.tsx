"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { DamageMap } from "@/components/map/damage-map";
import { Select } from "@/components/ui/select";
import { mockReports } from "@/lib/mock-data";
import type { DamageType, ReportStatus } from "@/lib/types";
import { DAMAGE_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";

export default function MapPage() {
  const [filterType, setFilterType] = useState<DamageType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");

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
          {[
            { color: "#7a7268", label: "Low" },
            { color: "#b87333", label: "Medium" },
            { color: "#c17f3a", label: "High" },
            { color: "#9b2c2c", label: "Critical" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-ink-secondary">{item.label} Severity</span>
            </div>
          ))}
        </div>

        <DamageMap
          reports={mockReports}
          height="600px"
          filterType={filterType}
          filterStatus={filterStatus}
        />
      </div>
    </RoleGuard>
  );
}
