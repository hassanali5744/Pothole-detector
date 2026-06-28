"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { mapUser } from "@/lib/mappers";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { User, UserRole } from "@/lib/types";

const roleColors: Record<UserRole, string> = {
  citizen: "bg-brand-50 text-brand-700 ring-brand-100",
  inspector: "bg-accent-50 text-accent-700 ring-accent-100",
  admin: "bg-surface-muted text-ink-secondary ring-line",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/users");
        setUsers((data as Record<string, unknown>[]).map(mapUser));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage citizens, inspectors, and administrators."
        >
          <Button>Add User</Button>
        </PageHeader>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted/60">
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted">Role</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted">Joined</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 font-display text-xs font-semibold text-accent-100">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-ink">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${roleColors[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
