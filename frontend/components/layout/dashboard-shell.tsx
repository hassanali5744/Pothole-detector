"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Bell,
  ClipboardCheck,
  CheckCircle,
  Wrench,
  Users,
  BarChart3,
  Map,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { useNotificationStore } from "@/lib/store/notification-store";
import { APP_NAME } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { mapNotifications } from "@/lib/mappers";
import { SlideInLeft, FadeIn, StaggerChildren, ScaleIn } from "@/components/animations";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navByRole: Record<UserRole, NavItem[]> = {
  citizen: [
    { label: "Dashboard", href: "/citizen", icon: LayoutDashboard },
    { label: "Upload Report", href: "/citizen/upload", icon: Upload },
    { label: "My Reports", href: "/citizen/reports", icon: FileText },
    { label: "Notifications", href: "/citizen/notifications", icon: Bell },
    { label: "Damage Map", href: "/map", icon: Map },
  ],
  inspector: [
    { label: "Dashboard", href: "/inspector", icon: LayoutDashboard },
    { label: "Pending Reports", href: "/inspector/pending", icon: ClipboardCheck },
    { label: "Verified Reports", href: "/inspector/verified", icon: CheckCircle },
    { label: "Repairs", href: "/inspector/repairs", icon: Wrench },
    { label: "Damage Map", href: "/map", icon: Map },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "All Reports", href: "/admin/reports", icon: FileText },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Damage Map", href: "/map", icon: Map },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const refreshUnreadCount = useNotificationStore((state) => state.refreshUnreadCount);

  useEffect(() => {
    if (user?.role !== "citizen") return;
    refreshUnreadCount();
  }, [user, refreshUnreadCount]);

  const navItems = user ? navByRole[user.role] : [];

  const dashboardHome =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "inspector"
        ? "/inspector"
        : "/citizen";

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SlideInLeft duration={0.5}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-line bg-surface shadow-[var(--shadow-elevated)] transition-transform lg:static lg:translate-x-0 lg:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ScaleIn duration={0.5}>
            <div className="flex h-[4.25rem] items-center gap-3 border-b border-line px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 ring-1 ring-brand-700/40">
                <Map className="h-4 w-4 text-accent-200" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold text-ink">
                  {APP_NAME}
                </span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-600">
                  {user?.role} portal
                </span>
              </div>
              <button
                className="rounded-lg p-1.5 text-muted hover:bg-surface-muted lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </ScaleIn>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Navigation
            </p>
            <StaggerChildren staggerDelay={0.05}>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== dashboardHome && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-brand-800 text-white shadow-[0_2px_8px_rgba(12,25,41,0.2)]"
                        : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent-200" : "")} />
                    {item.label}
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </StaggerChildren>
          </nav>

          <FadeIn duration={0.5} delay={0.3}>
            <div className="border-t border-line p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-surface-muted/60 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 font-display text-sm font-semibold text-accent-100">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                  <p className="truncate text-xs capitalize text-muted">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </FadeIn>
        </aside>
      </SlideInLeft>

      <FadeIn duration={0.6} delay={0.2} className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:px-8">
          <button
            className="rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 text-sm">
            <Link href={dashboardHome} className="font-medium text-muted hover:text-ink">
              Home
            </Link>
            {pathname !== dashboardHome && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
                <span className="capitalize font-medium text-ink">
                  {pathname.split("/").pop()?.replace("-", " ")}
                </span>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </FadeIn>
    </div>
  );
}
