"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-accent-500" />
          <p className="text-sm font-medium text-muted">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: ("citizen" | "inspector" | "admin")[];
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      const redirect =
        user.role === "admin"
          ? "/admin"
          : user.role === "inspector"
            ? "/inspector"
            : "/citizen";
      router.replace(redirect);
    }
  }, [user, allowedRoles, router]);

  if (!user || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
