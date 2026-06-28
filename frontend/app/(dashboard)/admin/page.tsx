"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Users, Wrench, AlertTriangle, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { ReportCard } from "@/components/reports/report-card";
import { apiClient } from "@/lib/api-client";
import { mapReports, mapAnalytics } from "@/lib/mappers";
import type { DamageReport, AnalyticsData } from "@/lib/types";

export default function AdminDashboard() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reportsData, usersData, analyticsData] = await Promise.all([
          apiClient.get("/api/reports"),
          apiClient.get("/api/users"),
          apiClient.get("/api/analytics"),
        ]);
        setReports(mapReports(reportsData as Record<string, unknown>[]));
        setUserCount((usersData as unknown[]).length);
        setAnalytics(mapAnalytics(analyticsData as Record<string, unknown>));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeRepairs = reports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
  const critical = reports.filter((r) => r.severity === "critical").length;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-8">
        <PageHeader
          title="Admin Dashboard"
          description="Monitor reports, manage users, and view platform analytics."
        />

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Reports" value={reports.length} icon={FileText} />
              <StatCard title="Active Repairs" value={activeRepairs} icon={Wrench} />
              <StatCard title="Total Users" value={userCount} icon={Users} />
              <StatCard title="Critical Issues" value={critical} icon={AlertTriangle} />
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Recent Reports</h2>
                <Link href="/admin/reports" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  View all
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reports.slice(0, 3).map((report) => (
                  <ReportCard key={report.id} report={report} showUser />
                ))}
              </div>
            </div>

            {analytics && (
              <div>
                <h2 className="mb-4 font-display text-lg font-semibold text-ink">Analytics Overview</h2>
                <AnalyticsCharts data={analytics} />
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
