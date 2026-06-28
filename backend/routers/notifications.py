from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pymongo import ReturnDocument
from database import get_db
from models import NotificationOut
from auth import get_current_user
from utils import format_notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
async def list_notifications(db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db.notifications.find({"userId": current_user["_id"]}).sort("createdAt", -1)
    notifications = await cursor.to_list(length=50)
    return [format_notification(n) for n in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.notifications.find_one_and_update(
        {"_id": notification_id, "userId": current_user["_id"]},
        {"$set": {"read": True}},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return format_notification(result)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.notifications.delete_one(
        {"_id": notification_id, "userId": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return None
