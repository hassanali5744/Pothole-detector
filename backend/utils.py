from typing import Any


def format_user(user: dict) -> dict:
    return {
        "_id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "createdAt": user["createdAt"],
    }


def format_report(report: dict) -> dict:
    return {
        "_id": report["_id"],
        "userId": report["userId"],
        "userName": report["userName"],
        "imageUrl": report["imageUrl"],
        "location": report["location"],
        "damageType": report["damageType"],
        "severity": report["severity"],
        "status": report["status"],
        "aiConfidence": report["aiConfidence"],
        "aiDetections": report.get("aiDetections", []),
        "aiExplanation": report.get("aiExplanation", ""),
        "createdAt": report["createdAt"],
        "updatedAt": report["updatedAt"],
        "assignedTo": report.get("assignedTo"),
        "notes": report.get("notes"),
        "scheduledDate": report.get("scheduledDate"),
        "priorityScore": report.get("priorityScore", 1),
        "protocolFollowed": report.get("protocolFollowed", True),
        "suggestedDepartment": report.get("suggestedDepartment", ""),
        "recommendedResponseTime": report.get("recommendedResponseTime", ""),
        "complaintText": report.get("complaintText", ""),
    }


def format_notification(notification: dict) -> dict:
    return {
        "_id": notification["_id"],
        "userId": notification["userId"],
        "title": notification["title"],
        "message": notification["message"],
        "type": notification["type"],
        "read": notification.get("read", False),
        "createdAt": notification["createdAt"],
        "reportId": notification.get("reportId"),
    }
