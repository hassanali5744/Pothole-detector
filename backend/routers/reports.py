from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
import os
import uuid
import json
import csv
import io
from datetime import datetime
from database import get_db
from models import ReportOut, ReportStatus, ReportUpdate, UserRole
from auth import get_current_user
from config import UPLOAD_DIR, SEVERITY_PRIORITY
from utils import format_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


async def create_notification(db, user_id: str, title: str, message: str, ntype: str, report_id: str):
    notification = {
        "_id": f"n{uuid.uuid4().hex[:8]}",
        "userId": user_id,
        "title": title,
        "message": message,
        "type": ntype,
        "read": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "reportId": report_id,
    }
    await db.notifications.insert_one(notification)


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    request: Request,
    address: str = Form(...),
    city: str = Form(...),
    latitude: float = Form(28.6139),
    longitude: float = Form(77.209),
    damageType: str = Form(...),
    severity: str = Form(...),
    aiConfidence: float = Form(...),
    aiDetections: str = Form("[]"),
    aiExplanation: str = Form(""),
    protocolFollowed: bool = Form(True),
    suggestedDepartment: str = Form(""),
    recommendedResponseTime: str = Form(""),
    complaintText: str = Form(""),
    severityPercentage: float = Form(0.0),
    priority: str = Form("medium"),
    file: Optional[UploadFile] = File(None),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    image_url = "https://images.unsplash.com/photo-1515169067865-5387ec356f45?w=800&q=80"
    if file and file.filename:
        try:
            file_ext = os.path.splitext(file.filename)[1] or ".jpg"
            unique_filename = f"{uuid.uuid4().hex}{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)

            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            base_url = str(request.base_url).rstrip("/")
            image_url = f"{base_url}/static/uploads/{unique_filename}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}",
            )

    try:
        detections_list = json.loads(aiDetections)
    except json.JSONDecodeError:
        detections_list = []

    if not detections_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis required before submitting. Run detection on the uploaded image first.",
        )

    severity = detections_list[0].get("severity", severity)
    damageType = detections_list[0].get("damageType", damageType)
    
    # Use AI-provided priority if available, otherwise map from severity
    ai_priority = detections_list[0].get("priority", priority) if detections_list else priority
    ai_severity_percentage = detections_list[0].get("severityPercentage", severityPercentage) if detections_list else severityPercentage
    
    # Calculate priority score based on AI priority
    priority_mapping = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    priority_score = priority_mapping.get(ai_priority.lower(), priority_mapping.get(severity, 2))

    report_id = f"r{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    new_report = {
        "_id": report_id,
        "userId": current_user["_id"],
        "userName": current_user["name"],
        "imageUrl": image_url,
        "location": {
            "lat": latitude,
            "lng": longitude,
            "address": address,
            "city": city,
        },
        "damageType": damageType,
        "severity": severity,
        "status": ReportStatus.REPORTED.value,
        "aiConfidence": aiConfidence,
        "aiDetections": detections_list,
        "aiExplanation": aiExplanation,
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "assignedTo": None,
        "notes": None,
        "scheduledDate": None,
        "priorityScore": priority_score,
        "protocolFollowed": protocolFollowed,
        "suggestedDepartment": suggestedDepartment,
        "recommendedResponseTime": recommendedResponseTime,
        "complaintText": complaintText,
        "severityPercentage": ai_severity_percentage,
        "priority": ai_priority,
    }

    await db.reports.insert_one(new_report)
    await create_notification(
        db,
        current_user["_id"],
        "Report Submitted",
        f"Your report at {address} has been received and is under review.",
        "success",
        report_id,
    )
    return format_report(new_report)


@router.get("", response_model=List[ReportOut])
async def get_reports(
    status: Optional[str] = None,
    damageType: Optional[str] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = {}

    if current_user["role"] == UserRole.CITIZEN.value:
        query["userId"] = current_user["_id"]

    if status and status != "all":
        query["status"] = status
    if damageType and damageType != "all":
        query["damageType"] = damageType

    # Inspectors/admins see highest severity & priority first
    if current_user["role"] in (UserRole.INSPECTOR.value, UserRole.ADMIN.value):
        sort_keys = [("priorityScore", -1), ("createdAt", -1)]
    else:
        sort_keys = [("createdAt", -1)]

    cursor = db.reports.find(query).sort(sort_keys)
    reports = await cursor.to_list(length=200)
    return [format_report(r) for r in reports]


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = await db.reports.find_one({"_id": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if current_user["role"] == UserRole.CITIZEN.value and report["userId"] != current_user["_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return format_report(report)


@router.patch("/{report_id}", response_model=ReportOut)
async def update_report(
    report_id: str,
    update: ReportUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in (UserRole.INSPECTOR.value, UserRole.ADMIN.value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inspector or admin access required")

    report = await db.reports.find_one({"_id": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    updates = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        return format_report(report)

    updates["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    await db.reports.update_one({"_id": report_id}, {"$set": updates})
    updated = await db.reports.find_one({"_id": report_id})

    # Notifications for status changes
    if "status" in updates:
        status_val = updates["status"]
        titles = {
            "verified": ("Report Verified", "Your report has been verified by an inspector.", "info"),
            "rejected": ("Report Rejected", "Your report was rejected after review.", "error"),
            "assigned": ("Repair Assigned", f"Repair team assigned for your report.", "info"),
            "in_progress": ("Repair In Progress", "Repair work has started on your report.", "info"),
            "completed": ("Repair Completed", "The repair for your report has been completed.", "success"),
        }
        if status_val in titles:
            title, message, ntype = titles[status_val]
            await create_notification(db, report["userId"], title, message, ntype, report_id)

    return format_report(updated)


@router.get("/export/csv")
async def export_reports_csv(
    status: Optional[str] = None,
    damageType: Optional[str] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in (UserRole.ADMIN.value, UserRole.INSPECTOR.value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or inspector access required")

    query = {}
    if status and status != "all":
        query["status"] = status
    if damageType and damageType != "all":
        query["damageType"] = damageType

    cursor = db.reports.find(query).sort("createdAt", -1)
    reports = await cursor.to_list(length=1000)

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID", "User ID", "User Name", "Location", "City", "Address",
        "Damage Type", "Severity", "Status", "AI Confidence",
        "Protocol Followed", "Suggested Department", "Recommended Response Time",
        "Assigned To", "Scheduled Date", "Notes", "Created At", "Updated At"
    ])
    
    # Write data rows
    for report in reports:
        writer.writerow([
            report.get("_id", ""),
            report.get("userId", ""),
            report.get("userName", ""),
            f"{report.get('location', {}).get('lat', '')}, {report.get('location', {}).get('lng', '')}",
            report.get("location", {}).get("city", ""),
            report.get("location", {}).get("address", ""),
            report.get("damageType", ""),
            report.get("severity", ""),
            report.get("status", ""),
            report.get("aiConfidence", ""),
            report.get("protocolFollowed", ""),
            report.get("suggestedDepartment", ""),
            report.get("recommendedResponseTime", ""),
            report.get("assignedTo", ""),
            report.get("scheduledDate", ""),
            report.get("notes", ""),
            report.get("createdAt", ""),
            report.get("updatedAt", ""),
        ])
    
    output.seek(0)
    
    # Create streaming response
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=reports_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )
    
    return response
