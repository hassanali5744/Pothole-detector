"use client";

import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { mockNotifications } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  success: "text-emerald-600 bg-emerald-50",
  info: "text-blue-600 bg-blue-50",
  warning: "text-amber-600 bg-amber-50",
  error: "text-red-600 bg-red-50",
};

export default function NotificationsPage() {
  const notifications = mockNotifications.filter((n) => n.userId === "u1");

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">Stay updated on your report status and repair progress.</p>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <div
                key={n.id}
                className={`flex gap-4 rounded-xl border p-4 ${
                  n.read ? "border-slate-200 bg-white" : "border-brand-200 bg-brand-50/50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorMap[n.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {!n.read && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-slate-500">No notifications yet.</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
