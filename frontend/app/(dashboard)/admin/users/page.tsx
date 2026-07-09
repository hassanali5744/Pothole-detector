"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "citizen" as UserRole });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleAddUser = async () => {
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: "tempPassword123", // Admin will need to set initial password
        role: formData.role,
      });
      const data = await apiClient.get("/api/users");
      setUsers((data as Record<string, unknown>[]).map(mapUser));
      setShowAddModal(false);
      setFormData({ name: "", email: "", role: "citizen" });
    } catch (e: any) {
      setError(e.message || "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setError("");
    try {
      await apiClient.patch(`/api/users/${selectedUser.id}`, formData);
      const data = await apiClient.get("/api/users");
      setUsers((data as Record<string, unknown>[]).map(mapUser));
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ name: "", email: "", role: "citizen" });
    } catch (e: any) {
      setError(e.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/api/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (e) {
      console.error("Failed to delete user:", e);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setShowEditModal(true);
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage citizens, inspectors, and administrators."
        >
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
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
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Select
                  label="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  options={[
                    { value: "citizen", label: "Citizen" },
                    { value: "inspector", label: "Inspector" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleAddUser} disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add User"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Select
                  label="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  options={[
                    { value: "citizen", label: "Citizen" },
                    { value: "inspector", label: "Inspector" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleEditUser} disabled={submitting} className="flex-1">
                    {submitting ? "Updating..." : "Update User"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
