"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/layout/auth-guard";
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Damage Map</h1>
          <p className="text-slate-500">
            Interactive map showing road damage locations, repair sites, and high-risk areas.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
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

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { color: "#64748b", label: "Low" },
            { color: "#eab308", label: "Medium" },
            { color: "#f97316", label: "High" },
            { color: "#ef4444", label: "Critical" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600">{item.label} Severity</span>
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
