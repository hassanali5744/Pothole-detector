"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import type { DamageReport } from "@/lib/types";

export default function VerifiedReportsPage() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/reports");
        const all = mapReports(data as Record<string, unknown>[]);
        setReports(
          all.filter(
            (r) =>
              r.status === "verified" ||
              r.status === "assigned" ||
              r.status === "in_progress" ||
              r.status === "completed"
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-6">
        <PageHeader
          title="Verified Reports"
          description="Reports that have been reviewed and approved by inspectors."
        />
        {loading ? (
          <div className="flex h-32 items-center justify-center">
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
