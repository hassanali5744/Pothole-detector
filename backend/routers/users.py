from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from database import get_db
from models import UserOut, UserRole
from auth import get_current_user
from security import get_password_hash, verify_password
from utils import format_user

router = APIRouter(prefix="/api/users", tags=["Users"])


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None


class PasswordReset(BaseModel):
    currentPassword: str
    newPassword: str


@router.get("", response_model=List[UserOut])
async def list_users(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    users = await db.users.find({}, {"password": 0}).sort("createdAt", -1).to_list(length=200)
    return [format_user(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value and current_user["_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user = await db.users.find_one({"_id": user_id}, {"password": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return format_user(user)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    update: UserUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value and current_user["_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Only admins can change roles
    if update.role and current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can change roles")

    updates = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        return format_user(user)

    # Check email uniqueness if email is being updated
    if "email" in updates:
        existing = await db.users.find_one({"email": updates["email"].lower(), "_id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        updates["email"] = updates["email"].lower()

    await db.users.update_one({"_id": user_id}, {"$set": updates})
    updated = await db.users.find_one({"_id": user_id}, {"password": 0})
    return format_user(updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    if user_id == current_user["_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return None


@router.post("/{user_id}/reset-password", response_model=dict)
async def reset_password(
    user_id: str,
    password_data: PasswordReset,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != UserRole.ADMIN.value and current_user["_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not verify_password(password_data.currentPassword, user["password"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(password_data.newPassword) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters")

    hashed_password = get_password_hash(password_data.newPassword)
    await db.users.update_one({"_id": user_id}, {"$set": {"password": hashed_password}})

    return {"message": "Password updated successfully"}
