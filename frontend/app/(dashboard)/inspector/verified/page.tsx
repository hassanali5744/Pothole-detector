"use client";

import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { mockReports } from "@/lib/mock-data";

export default function VerifiedReportsPage() {
  const verified = mockReports.filter(
    (r) => r.status === "verified" || r.status === "assigned" || r.status === "in_progress" || r.status === "completed"
  );

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-6">
        <PageHeader
          title="Verified Reports"
          description="Reports that have been reviewed and approved by inspectors."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verified.map((report) => (
            <ReportCard key={report.id} report={report} showUser />
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
