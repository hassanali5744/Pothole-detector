from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from typing import List, Optional
import os
import uuid
import json
from datetime import datetime
from database import get_db
from models import ReportOut, ReportStatus, ReportUpdate, UserRole
from auth import get_current_user
from config import UPLOAD_DIR
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

    cursor = db.reports.find(query).sort("createdAt", -1)
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
