"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Upload, Bell, Clock, Loader2, X } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/reports/report-card";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { mapReports, mapNotifications } from "@/lib/mappers";
import { useNotificationStore } from "@/lib/store/notification-store";
import type { DamageReport, Notification } from "@/lib/types";

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const decrementUnreadCount = useNotificationStore((state) => state.decrementUnreadCount);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [reportsData, notifData] = await Promise.all([
          apiClient.get("/api/reports"),
          apiClient.get("/api/notifications"),
        ]);
        setReports(mapReports(reportsData as Record<string, unknown>[]));
        setNotifications(mapNotifications(notifData as Record<string, unknown>[]));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (isRead) return;

    const previousNotifications = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    decrementUnreadCount();

    try {
      await apiClient.patch(`/api/notifications/${id}/read`, {});
      refreshUnreadCount();
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
      setNotifications(previousNotifications);
      refreshUnreadCount();
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    const previousNotifications = notifications;
    const dismissed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (dismissed && !dismissed.read) {
      decrementUnreadCount();
    }

    try {
      await apiClient.delete(`/api/notifications/${id}`);
      refreshUnreadCount();
    } catch (e) {
      console.error("Failed to delete notification:", e);
      setNotifications(previousNotifications);
      refreshUnreadCount();
    }
  };

  const pending = reports.filter((r) => r.status === "reported").length;
  const inProgress = reports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
  const completed = reports.filter((r) => r.status === "completed").length;

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="space-y-8">
        <PageHeader
          title={`Welcome back, ${user?.name.split(" ")[0]}`}
          description="Track your road damage reports and complaints."
        >
          <Link href="/citizen/upload">
            <Button>
              <Upload className="h-4 w-4" />
              Report Damage
            </Button>
          </Link>
        </PageHeader>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Reports" value={reports.length} icon={FileText} />
              <StatCard title="Pending Review" value={pending} icon={Clock} />
              <StatCard title="In Progress" value={inProgress} icon={Upload} />
              <StatCard title="Completed" value={completed} icon={Bell} />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-ink">Recent Reports</h2>
                  <Link href="/citizen/reports" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {reports.slice(0, 4).map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-ink">Notifications</h2>
                  <Link href="/citizen/notifications" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.read)}
                      className={`group relative flex flex-col rounded-xl border p-4 transition-colors cursor-pointer ${
                        n.read ? "border-line bg-surface" : "border-accent-200 bg-accent-50/60"
                      }`}
                    >
                      <div className="min-w-0 pr-6">
                        <p className={`text-sm text-ink ${n.read ? "font-normal" : "font-semibold"}`}>
                          {n.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{n.message}</p>
                        <p className="mt-2 text-xs text-muted/70">{formatDateTime(n.createdAt)}</p>
                      </div>

                      {/* Small Cross Dismiss Button */}
                      <button
                        onClick={(e) => handleDismiss(e, n.id)}
                        className="absolute right-3 top-3 rounded-md p-1 text-muted/40 hover:bg-line/40 hover:text-ink transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line-strong py-8 text-center">
                      <Bell className="mx-auto h-6 w-6 text-line-strong" />
                      <p className="mt-2 text-xs text-muted">No notifications yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}