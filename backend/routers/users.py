from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import get_db
from models import UserOut, UserRole
from auth import get_current_user
from utils import format_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserOut])
async def list_users(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    users = await db.users.find({}, {"password": 0}).sort("createdAt", -1).to_list(length=200)
    return [format_user(u) for u in users]
