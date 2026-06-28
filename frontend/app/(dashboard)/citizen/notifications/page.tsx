"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Loader2, X } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { apiClient } from "@/lib/api-client";
import { mapNotifications } from "@/lib/mappers";
import { useNotificationStore } from "@/lib/store/notification-store";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const decrementUnreadCount = useNotificationStore((state) => state.decrementUnreadCount);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/notifications");
        setNotifications(mapNotifications(data as Record<string, unknown>[]));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (isRead) return; // Already read, no action needed

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
    e.stopPropagation(); // Prevents clicking the cross from firing the row click event

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

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Notifications"
          description="Stay updated on your report status and repair progress."
        />

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = iconMap[n.type];
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.read)}
                  className={`group relative flex gap-4 rounded-xl border p-4 transition-colors cursor-pointer ${
                    n.read ? "border-line bg-surface" : "border-accent-200 bg-accent-50/50"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorMap[n.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-ink ${n.read ? "font-normal" : "font-semibold"}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="shrink-0 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span >
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{n.message}</p>
                    <p className="mt-2 text-xs text-muted/70">{formatDateTime(n.createdAt)}</p>
                  </div>

                  {/* Small Cross Dismiss Button */}
                  <button
                    onClick={(e) => handleDismiss(e, n.id)}
                    className="absolute right-3 top-3 rounded-md p-1 text-muted/40 hover:bg-line/40 hover:text-ink transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-line-strong" />
            <p className="mt-2 text-muted">No notifications yet.</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}