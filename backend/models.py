from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    CITIZEN = "citizen"
    INSPECTOR = "inspector"
    ADMIN = "admin"

class ReportStatus(str, Enum):
    REPORTED = "reported"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"

class DamageType(str, Enum):
    POTHOLE = "pothole"
    CRACK = "crack"
    FADED_MARKINGS = "faded_markings"
    WATERLOGGING = "waterlogging"
    DEBRIS = "debris"

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# User Models
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CITIZEN

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: UserRole
    createdAt: str

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Location Models
class LocationSchema(BaseModel):
    lat: float
    lng: float
    address: str
    city: str

# AI Detection Models
class AIDetectionSchema(BaseModel):
    damageType: DamageType
    confidence: float
    severity: SeverityLevel
    explanation: str
    severityPercentage: Optional[float] = None  # 0-100 score from Gemini
    priority: Optional[str] = None  # "critical", "high", "medium", "low"

# Report Models
class ReportCreate(BaseModel):
    location: LocationSchema
    damageType: DamageType
    severity: SeverityLevel
    aiConfidence: float
    aiDetections: List[AIDetectionSchema]
    aiExplanation: str
    protocolFollowed: Optional[bool] = None
    suggestedDepartment: Optional[str] = None
    recommendedResponseTime: Optional[str] = None
    complaintText: Optional[str] = None

class ReportOut(BaseModel):
    id: str = Field(..., alias="_id")
    userId: str
    userName: str
    imageUrl: str
    location: LocationSchema
    damageType: DamageType
    severity: SeverityLevel
    status: ReportStatus
    aiConfidence: float
    aiDetections: List[AIDetectionSchema]
    aiExplanation: str
    createdAt: str
    updatedAt: str
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    scheduledDate: Optional[str] = None
    protocolFollowed: Optional[bool] = None
    suggestedDepartment: Optional[str] = None
    recommendedResponseTime: Optional[str] = None
    complaintText: Optional[str] = None
    severityPercentage: Optional[float] = None
    priority: Optional[str] = None

    class Config:
        populate_by_name = True


class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    severity: Optional[SeverityLevel] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    scheduledDate: Optional[str] = None


class NotificationOut(BaseModel):
    id: str = Field(..., alias="_id")
    userId: str
    title: str
    message: str
    type: str
    read: bool
    createdAt: str
    reportId: Optional[str] = None

    class Config:
        populate_by_name = True


class AnalyticsOut(BaseModel):
    damageByType: List[dict]
    monthlyReports: List[dict]
    cityWiseDamage: List[dict]
    repairCompletion: List[dict]
    severityDistribution: List[dict]
