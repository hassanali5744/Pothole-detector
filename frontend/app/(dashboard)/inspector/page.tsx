"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, CheckCircle, Wrench, AlertTriangle, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { apiClient } from "@/lib/api-client";
import { mapReports } from "@/lib/mappers";
import type { DamageReport } from "@/lib/types";

export default function InspectorDashboard() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/reports");
        setReports(mapReports(data as Record<string, unknown>[]));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = reports.filter((r) => r.status === "reported");
  const verified = reports.filter((r) => r.status === "verified");
  const activeRepairs = reports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  );

  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="space-y-8">
        <PageHeader
          title="Inspector Dashboard"
          description="Review AI detections and manage road repair assignments."
        />

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/inspector/pending" className="contents">
                <StatCard 
                  title="Pending Review" 
                  value={pending.length} 
                  icon={ClipboardCheck} 
                  className="cursor-pointer"
                />
              </Link>
              
              <Link href="/inspector/verified" className="contents">
                <StatCard
                  title="Verified Reports"
                  value={verified.length}
                  icon={CheckCircle}
                  className="cursor-pointer"
                />
              </Link>
              
              <Link href="/inspector/repairs" className="contents">
                <StatCard 
                  title="Active Repairs" 
                  value={activeRepairs.length} 
                  icon={Wrench} 
                  className="cursor-pointer"
                />
              </Link>
              
              <Link href="/inspector/pending?severity=critical" className="contents">
                <StatCard
                  title="Critical Issues"
                  value={reports.filter((r) => r.severity === "critical").length}
                  icon={AlertTriangle}
                  className="cursor-pointer"
                />
              </Link>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Pending Reports</h2>
                <Link href="/inspector/pending" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  View all
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.slice(0, 3).map((report) => (
                  <ReportCard key={report.id} report={report} showUser />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}