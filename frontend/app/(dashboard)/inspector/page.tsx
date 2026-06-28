"use client";

import Link from "next/link";
import { ClipboardCheck, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { mockReports, mockRepairs } from "@/lib/mock-data";

export default function InspectorDashboard() {
  const pending = mockReports.filter((r) => r.status === "reported");
  const verified = mockReports.filter((r) => r.status === "verified");
  const activeRepairs = mockRepairs.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  );

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-8">
        <PageHeader
          title="Inspector Dashboard"
          description="Review AI detections and manage road repair assignments."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending Review" value={pending.length} icon={ClipboardCheck} />
          <StatCard title="Verified Reports" value={verified.length} icon={CheckCircle} />
          <StatCard title="Active Repairs" value={activeRepairs.length} icon={Wrench} />
          <StatCard
            title="Critical Issues"
            value={mockReports.filter((r) => r.severity === "critical").length}
            icon={AlertTriangle}
          />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Pending Reports</h2>
            <Link href="/inspector/pending" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.slice(0, 3).map((report) => (
              <ReportCard key={report.id} report={report} showUser />
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
