"use client";

import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { mockAnalytics } from "@/lib/mock-data";

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Comprehensive insights into road damage trends and repair performance."
        />
        <AnalyticsCharts data={mockAnalytics} />
      </div>
    </RoleGuard>
  );
}
