import type { DamageType, ReportStatus, SeverityLevel, UserRole } from "./types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "RoadVision AI";

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  pothole: "Pothole",
  crack: "Road Crack",
  faded_markings: "Faded Lane Markings",
  waterlogging: "Waterlogging",
  debris: "Road Debris",
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  inspector: "Road Inspector",
  admin: "Administrator",
};

export const STATUS_FLOW: ReportStatus[] = [
  "reported",
  "verified",
  "assigned",
  "in_progress",
  "completed",
];

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
