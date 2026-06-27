"use client";

import Link from "next/link";
import { FileText, Upload, Bell, Clock } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/reports/report-card";
import { mockReports, mockNotifications } from "@/lib/mock-data";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDateTime } from "@/lib/utils";

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const myReports = mockReports.filter((r) => r.userId === user?.id || r.userId === "u1");
  const pending = myReports.filter((r) => r.status === "reported").length;
  const inProgress = myReports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
  const completed = myReports.filter((r) => r.status === "completed").length;
  const notifications = mockNotifications.filter((n) => n.userId === "u1").slice(0, 3);

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.name.split(" ")[0]}
            </h1>
            <p className="text-slate-500">Track your road damage reports and complaints.</p>
          </div>
          <Link href="/citizen/upload">
            <Button>
              <Upload className="h-4 w-4" />
              Report Damage
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Reports" value={myReports.length} icon={FileText} />
          <StatCard title="Pending Review" value={pending} icon={Clock} />
          <StatCard title="In Progress" value={inProgress} icon={Upload} />
          <StatCard title="Completed" value={completed} icon={Bell} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
              <Link href="/citizen/reports" className="text-sm text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {myReports.slice(0, 4).map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <Link
                href="/citizen/notifications"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-4 ${n.read ? "border-slate-200 bg-white" : "border-brand-200 bg-brand-50"}`}
                >
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
