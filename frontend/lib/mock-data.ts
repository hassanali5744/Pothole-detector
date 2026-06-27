import type {
  AnalyticsData,
  DamageReport,
  Notification,
  RepairAssignment,
  User,
} from "./types";

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "John Citizen",
    email: "citizen@roadvision.ai",
    role: "citizen",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "u2",
    name: "Sarah Inspector",
    email: "inspector@roadvision.ai",
    role: "inspector",
    createdAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "u3",
    name: "Admin User",
    email: "admin@roadvision.ai",
    role: "admin",
    createdAt: "2025-01-01T10:00:00Z",
  },
];

export const mockReports: DamageReport[] = [
  {
    id: "r1",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1515169067865-5387ec356f45?w=800&q=80",
    location: {
      lat: 28.6139,
      lng: 77.209,
      address: "Connaught Place, Block A",
      city: "New Delhi",
    },
    damageType: "pothole",
    severity: "high",
    status: "reported",
    aiConfidence: 0.94,
    aiDetections: [
      {
        damageType: "pothole",
        confidence: 0.94,
        severity: "high",
        explanation:
          "Large circular depression detected with irregular edges, estimated depth significant.",
      },
    ],
    aiExplanation:
      "AI detected a large pothole with high confidence. Recommended priority repair due to size and location on a busy road.",
    createdAt: "2026-06-20T08:30:00Z",
    updatedAt: "2026-06-20T08:30:00Z",
  },
  {
    id: "r2",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=800&q=80",
    location: {
      lat: 28.5355,
      lng: 77.391,
      address: "Sector 18, Noida",
      city: "Noida",
    },
    damageType: "crack",
    severity: "medium",
    status: "verified",
    aiConfidence: 0.87,
    aiDetections: [
      {
        damageType: "crack",
        confidence: 0.87,
        severity: "medium",
        explanation: "Linear crack pattern detected spanning approximately 2 meters.",
      },
    ],
    aiExplanation:
      "Surface crack detected with moderate severity. May worsen with heavy traffic and monsoon.",
    createdAt: "2026-06-18T14:15:00Z",
    updatedAt: "2026-06-19T09:00:00Z",
  },
  {
    id: "r3",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
    location: {
      lat: 28.4595,
      lng: 77.0266,
      address: "MG Road, Gurgaon",
      city: "Gurgaon",
    },
    damageType: "waterlogging",
    severity: "critical",
    status: "assigned",
    aiConfidence: 0.91,
    aiDetections: [
      {
        damageType: "waterlogging",
        confidence: 0.91,
        severity: "critical",
        explanation:
          "Standing water covering significant road surface area, potential drainage failure.",
      },
    ],
    aiExplanation:
      "Critical waterlogging detected. Immediate attention required — poses safety hazard to vehicles.",
    createdAt: "2026-06-15T06:45:00Z",
    updatedAt: "2026-06-17T11:30:00Z",
    assignedTo: "Team Alpha",
  },
  {
    id: "r4",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    location: {
      lat: 28.7041,
      lng: 77.1025,
      address: "Ring Road, Pitampura",
      city: "New Delhi",
    },
    damageType: "faded_markings",
    severity: "low",
    status: "in_progress",
    aiConfidence: 0.82,
    aiDetections: [
      {
        damageType: "faded_markings",
        confidence: 0.82,
        severity: "low",
        explanation: "Lane markings visibility below acceptable threshold.",
      },
    ],
    aiExplanation:
      "Faded lane markings detected. Repainting recommended for traffic safety compliance.",
    createdAt: "2026-06-10T10:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z",
    assignedTo: "Team Beta",
  },
  {
    id: "r5",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    location: {
      lat: 28.628,
      lng: 77.2065,
      address: "India Gate Circle",
      city: "New Delhi",
    },
    damageType: "debris",
    severity: "medium",
    status: "completed",
    aiConfidence: 0.89,
    aiDetections: [
      {
        damageType: "debris",
        confidence: 0.89,
        severity: "medium",
        explanation: "Foreign objects detected on road surface obstructing traffic flow.",
      },
    ],
    aiExplanation:
      "Road debris identified on main carriageway. Cleared by maintenance team.",
    createdAt: "2026-06-05T16:20:00Z",
    updatedAt: "2026-06-08T12:00:00Z",
    assignedTo: "Team Gamma",
  },
  {
    id: "r6",
    userId: "u1",
    userName: "John Citizen",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
    location: {
      lat: 28.5672,
      lng: 77.2100,
      address: "Saket, District Centre",
      city: "New Delhi",
    },
    damageType: "pothole",
    severity: "high",
    status: "reported",
    aiConfidence: 0.96,
    aiDetections: [
      {
        damageType: "pothole",
        confidence: 0.96,
        severity: "high",
        explanation: "Multiple potholes detected in close proximity.",
      },
    ],
    aiExplanation:
      "Cluster of potholes detected with very high confidence. Area requires comprehensive resurfacing.",
    createdAt: "2026-06-25T07:00:00Z",
    updatedAt: "2026-06-25T07:00:00Z",
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    title: "Report Accepted",
    message: "Your pothole report at Connaught Place has been received and is under review.",
    type: "success",
    read: false,
    createdAt: "2026-06-20T08:35:00Z",
    reportId: "r1",
  },
  {
    id: "n2",
    userId: "u1",
    title: "Report Verified",
    message: "Your crack report at Sector 18, Noida has been verified by an inspector.",
    type: "info",
    read: false,
    createdAt: "2026-06-19T09:05:00Z",
    reportId: "r2",
  },
  {
    id: "n3",
    userId: "u1",
    title: "Repair Assigned",
    message: "Team Alpha has been assigned to fix waterlogging at MG Road, Gurgaon.",
    type: "info",
    read: true,
    createdAt: "2026-06-17T11:35:00Z",
    reportId: "r3",
  },
  {
    id: "n4",
    userId: "u1",
    title: "Repair Completed",
    message: "Road debris at India Gate Circle has been cleared. Thank you for reporting!",
    type: "success",
    read: true,
    createdAt: "2026-06-08T12:05:00Z",
    reportId: "r5",
  },
];

export const mockRepairs: RepairAssignment[] = [
  {
    id: "rep1",
    reportId: "r3",
    teamName: "Team Alpha",
    assignedBy: "Sarah Inspector",
    scheduledDate: "2026-06-20T09:00:00Z",
    status: "assigned",
    notes: "Drainage inspection required before repair.",
  },
  {
    id: "rep2",
    reportId: "r4",
    teamName: "Team Beta",
    assignedBy: "Sarah Inspector",
    scheduledDate: "2026-06-22T08:00:00Z",
    status: "in_progress",
    notes: "Lane marking repaint in progress.",
  },
  {
    id: "rep3",
    reportId: "r5",
    teamName: "Team Gamma",
    assignedBy: "Sarah Inspector",
    scheduledDate: "2026-06-06T10:00:00Z",
    status: "completed",
  },
];

export const mockAnalytics: AnalyticsData = {
  damageByType: [
    { type: "pothole", count: 45 },
    { type: "crack", count: 32 },
    { type: "faded_markings", count: 18 },
    { type: "waterlogging", count: 12 },
    { type: "debris", count: 8 },
  ],
  monthlyReports: [
    { month: "Jan", count: 28 },
    { month: "Feb", count: 35 },
    { month: "Mar", count: 42 },
    { month: "Apr", count: 38 },
    { month: "May", count: 51 },
    { month: "Jun", count: 47 },
  ],
  cityWiseDamage: [
    { city: "New Delhi", count: 68 },
    { city: "Noida", count: 34 },
    { city: "Gurgaon", count: 28 },
    { city: "Faridabad", count: 15 },
  ],
  repairCompletion: [
    { month: "Jan", completed: 22, assigned: 28 },
    { month: "Feb", completed: 30, assigned: 35 },
    { month: "Mar", completed: 38, assigned: 42 },
    { month: "Apr", completed: 32, assigned: 38 },
    { month: "May", completed: 45, assigned: 51 },
    { month: "Jun", completed: 40, assigned: 47 },
  ],
  severityDistribution: [
    { severity: "low", count: 25 },
    { severity: "medium", count: 42 },
    { severity: "high", count: 35 },
    { severity: "critical", count: 13 },
  ],
};
