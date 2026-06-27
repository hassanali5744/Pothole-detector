"use client";

import { FileText, Users, Wrench, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { ReportCard } from "@/components/reports/report-card";
import { mockReports, mockAnalytics, mockUsers } from "@/lib/mock-data";

export default function AdminDashboard() {
  const activeRepairs = mockReports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
  const critical = mockReports.filter((r) => r.severity === "critical").length;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">
            Monitor reports, manage users, and view platform analytics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Reports" value={mockReports.length} icon={FileText} />
          <StatCard title="Active Repairs" value={activeRepairs} icon={Wrench} />
          <StatCard title="Total Users" value={mockUsers.length} icon={Users} />
          <StatCard title="Critical Issues" value={critical} icon={AlertTriangle} />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <Link href="/admin/reports" className="text-sm text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockReports.slice(0, 3).map((report) => (
              <ReportCard key={report.id} report={report} showUser />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Analytics Overview</h2>
          <AnalyticsCharts data={mockAnalytics} />
        </div>
      </div>
    </RoleGuard>
  );
}
