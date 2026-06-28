"use client";

import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { mockNotifications } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  success: "text-success bg-success-soft",
  info: "text-brand-700 bg-brand-50",
  warning: "text-accent-700 bg-accent-50",
  error: "text-danger bg-danger-soft",
};

export default function NotificationsPage() {
  const notifications = mockNotifications.filter((n) => n.userId === "u1");

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Notifications"
          description="Stay updated on your report status and repair progress."
        />

        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <div
                key={n.id}
                className={`flex gap-4 rounded-xl border p-4 transition-colors ${
                  n.read ? "border-line bg-surface" : "border-accent-200 bg-accent-50/50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorMap[n.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{n.title}</p>
                    {!n.read && (
                      <span className="shrink-0 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{n.message}</p>
                  <p className="mt-2 text-xs text-muted/70">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-line-strong" />
            <p className="mt-2 text-muted">No notifications yet.</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
