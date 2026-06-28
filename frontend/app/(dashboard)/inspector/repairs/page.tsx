"use client";

import { useState } from "react";
import { Wrench, Calendar } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader
          title="Repair Management"
          description="Assign and track road repair teams."
        >
          <Button onClick={() => setShowAssign(!showAssign)}>
            <Wrench className="h-4 w-4" />
            Assign New Repair
          </Button>
        </PageHeader>

        {showAssign && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-display font-semibold text-ink">Assign Repair Team</h3>
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
          <div className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
            Repair team assigned successfully!
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-5 text-sm">
          {["Reported", "Verified", "Assigned", "In Progress", "Completed"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded-full bg-brand-800 px-3.5 py-1.5 font-semibold text-accent-100">
                {s}
              </span>
              {i < arr.length - 1 && <span className="text-line-strong">→</span>}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {mockRepairs.map((repair) => {
            const report = mockReports.find((r) => r.id === repair.reportId);
            if (!report) return null;
            return (
              <Card key={repair.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-ink">
                        {DAMAGE_TYPE_LABELS[report.damageType]}
                      </h3>
                      <StatusBadge status={repair.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{report.location.address}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted/80">
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3 text-accent-600" />
                        {repair.teamName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(repair.scheduledDate)}
                      </span>
                    </div>
                  </div>
                  {repair.notes && (
                    <p className="text-xs leading-relaxed text-muted sm:max-w-xs">{repair.notes}</p>
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
