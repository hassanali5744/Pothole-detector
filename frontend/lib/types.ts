export type UserRole = "citizen" | "inspector" | "admin";

export type ReportStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "in_progress"
  | "completed"
  | "rejected";

export type DamageType =
  | "pothole"
  | "crack"
  | "faded_markings"
  | "waterlogging"
  | "debris";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AIDetection {
  damageType: DamageType;
  confidence: number;
  severity: SeverityLevel;
  explanation: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface DamageReport {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  location: Location;
  damageType: DamageType;
  severity: SeverityLevel;
  status: ReportStatus;
  aiConfidence: number;
  aiDetections: AIDetection[];
  aiExplanation: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  notes?: string;
  scheduledDate?: string;
  protocolFollowed?: boolean;
  suggestedDepartment?: string;
  recommendedResponseTime?: string;
  complaintText?: string;
  duplicateCheck?: {
    isDuplicate: boolean;
    similarityScore: number;
    existingId?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  reportId?: string;
}

export interface RepairAssignment {
  id: string;
  reportId: string;
  teamName: string;
  assignedBy: string;
  scheduledDate: string;
  status: ReportStatus;
  notes?: string;
}

export interface AnalyticsData {
  damageByType: { type: DamageType; count: number }[];
  monthlyReports: { month: string; count: number }[];
  cityWiseDamage: { city: string; count: number }[];
  repairCompletion: { month: string; completed: number; assigned: number }[];
  severityDistribution: { severity: SeverityLevel; count: number }[];
}
