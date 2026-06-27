"use client";

import { ClipboardCheck, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { ReportCard } from "@/components/reports/report-card";
import { mockReports, mockRepairs } from "@/lib/mock-data";
import Link from "next/link";

export default function InspectorDashboard() {
  const pending = mockReports.filter((r) => r.status === "reported");
  const verified = mockReports.filter((r) => r.status === "verified");
  const activeRepairs = mockRepairs.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  );

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspector Dashboard</h1>
          <p className="text-slate-500">Review AI detections and manage road repair assignments.</p>
        </div>

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
            <h2 className="text-lg font-semibold text-slate-900">Pending Reports</h2>
            <Link href="/inspector/pending" className="text-sm text-brand-600 hover:text-brand-700">
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
