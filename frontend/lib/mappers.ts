import type {
  DamageReport,
  User,
  Notification,
  AnalyticsData,
  DamageType,
  SeverityLevel,
  ReportStatus,
  UserRole,
} from "./types";

/** Map API `_id` fields to frontend `id` */
export function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw._id ?? raw.id),
    name: String(raw.name),
    email: String(raw.email),
    role: raw.role as UserRole,
    createdAt: String(raw.createdAt),
  };
}

export function mapReport(raw: Record<string, unknown>): DamageReport {
  return {
    id: String(raw._id ?? raw.id),
    userId: String(raw.userId),
    userName: String(raw.userName),
    imageUrl: String(raw.imageUrl),
    location: raw.location as DamageReport["location"],
    damageType: raw.damageType as DamageType,
    severity: raw.severity as SeverityLevel,
    status: raw.status as ReportStatus,
    aiConfidence: Number(raw.aiConfidence),
    aiDetections: (raw.aiDetections as DamageReport["aiDetections"]) ?? [],
    aiExplanation: String(raw.aiExplanation ?? ""),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    assignedTo: raw.assignedTo ? String(raw.assignedTo) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    scheduledDate: raw.scheduledDate ? String(raw.scheduledDate) : undefined,
    protocolFollowed: raw.protocolFollowed !== undefined ? Boolean(raw.protocolFollowed) : undefined,
    suggestedDepartment: raw.suggestedDepartment ? String(raw.suggestedDepartment) : undefined,
    recommendedResponseTime: raw.recommendedResponseTime ? String(raw.recommendedResponseTime) : undefined,
    complaintText: raw.complaintText ? String(raw.complaintText) : undefined,
    duplicateCheck: raw.duplicateCheck ? {
      isDuplicate: Boolean((raw.duplicateCheck as Record<string, unknown>).isDuplicate),
      similarityScore: Number((raw.duplicateCheck as Record<string, unknown>).similarityScore),
      existingId: (raw.duplicateCheck as Record<string, unknown>).existingId ? String((raw.duplicateCheck as Record<string, unknown>).existingId) : undefined,
    } : undefined,
  };
}

export function mapReports(raw: Record<string, unknown>[]): DamageReport[] {
  return raw.map(mapReport);
}

export function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: String(raw._id ?? raw.id),
    userId: String(raw.userId),
    title: String(raw.title),
    message: String(raw.message),
    type: raw.type as Notification["type"],
    read: Boolean(raw.read),
    createdAt: String(raw.createdAt),
    reportId: raw.reportId ? String(raw.reportId) : undefined,
  };
}

export function mapNotifications(raw: Record<string, unknown>[]): Notification[] {
  return raw.map(mapNotification);
}

export function mapAnalytics(raw: Record<string, unknown>): AnalyticsData {
  return {
    damageByType: (raw.damageByType as AnalyticsData["damageByType"]) ?? [],
    monthlyReports: (raw.monthlyReports as AnalyticsData["monthlyReports"]) ?? [],
    cityWiseDamage: (raw.cityWiseDamage as AnalyticsData["cityWiseDamage"]) ?? [],
    repairCompletion: (raw.repairCompletion as AnalyticsData["repairCompletion"]) ?? [],
    severityDistribution: (raw.severityDistribution as AnalyticsData["severityDistribution"]) ?? [],
  };
}
