"use client";

import { RoleGuard } from "@/components/layout/auth-guard";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { mockAnalytics } from "@/lib/mock-data";

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">
            Comprehensive insights into road damage trends and repair performance.
          </p>
        </div>
        <AnalyticsCharts data={mockAnalytics} />
      </div>
    </RoleGuard>
  );
}
