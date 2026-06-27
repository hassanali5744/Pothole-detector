"use client";

import { useState } from "react";
import { Wrench, Calendar } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockRepairs, mockReports } from "@/lib/mock-data";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function RepairsPage() {
  const [showAssign, setShowAssign] = useState(false);
  const [team, setTeam] = useState("Team Alpha");
  const [assigned, setAssigned] = useState(false);

  const unassigned = mockReports.filter((r) => r.status === "verified");

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Repair Management</h1>
            <p className="text-slate-500">Assign and track road repair teams.</p>
          </div>
          <Button onClick={() => setShowAssign(!showAssign)}>
            <Wrench className="h-4 w-4" />
            Assign New Repair
          </Button>
        </div>

        {showAssign && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-slate-900">Assign Repair Team</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Select
                  id="report"
                  label="Select Report"
                  options={unassigned.map((r) => ({
                    value: r.id,
                    label: `${DAMAGE_TYPE_LABELS[r.damageType]} - ${r.location.address}`,
                  }))}
                />
                <Select
                  id="team"
                  label="Repair Team"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  options={[
                    { value: "Team Alpha", label: "Team Alpha" },
                    { value: "Team Beta", label: "Team Beta" },
                    { value: "Team Gamma", label: "Team Gamma" },
                  ]}
                />
                <Input id="date" label="Scheduled Date" type="date" />
              </div>
              <Button
                className="mt-4"
                onClick={() => { setAssigned(true); setShowAssign(false); }}
              >
                Confirm Assignment
              </Button>
            </CardContent>
          </Card>
        )}

        {assigned && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Repair team assigned successfully!
          </div>
        )}

        {/* Status flow */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          {["Reported", "Verified", "Assigned", "In Progress", "Completed"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-700">
                {s}
              </span>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {mockRepairs.map((repair) => {
            const report = mockReports.find((r) => r.id === repair.reportId);
            if (!report) return null;
            return (
              <Card key={repair.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">
                        {DAMAGE_TYPE_LABELS[report.damageType]}
                      </h3>
                      <StatusBadge status={repair.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{report.location.address}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {repair.teamName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(repair.scheduledDate)}
                      </span>
                    </div>
                  </div>
                  {repair.notes && (
                    <p className="text-xs text-slate-500 sm:max-w-xs">{repair.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}
