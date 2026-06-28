"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { apiClient } from "@/lib/api-client";
import { mapAnalytics } from "@/lib/mappers";
import type { AnalyticsData } from "@/lib/types";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get("/api/analytics");
        setAnalytics(mapAnalytics(data as Record<string, unknown>));
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
          title="Analytics"
          description="Comprehensive insights into road damage trends and repair performance."
        />
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          </div>
        ) : analytics ? (
          <AnalyticsCharts data={analytics} />
        ) : null}
      </div>
    </RoleGuard>
  );
}
