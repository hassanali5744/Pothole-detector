import { apiClient } from "@/lib/api-client";
import { mapReports, mapReport } from "@/lib/mappers";
import type { DamageReport, ReportStatus, SeverityLevel } from "@/lib/types";

export async function fetchReports(params?: {
  status?: string;
  damageType?: string;
}): Promise<DamageReport[]> {
  const data = await apiClient.get("/api/reports", { params });
  return mapReports(data as Record<string, unknown>[]);
}

export async function updateReport(
  reportId: string,
  updates: {
    status?: ReportStatus;
    severity?: SeverityLevel;
    assignedTo?: string;
    notes?: string;
    scheduledDate?: string;
  }
): Promise<DamageReport> {
  const data = await apiClient.patch(`/api/reports/${reportId}`, updates);
  return mapReport(data as Record<string, unknown>);
}
