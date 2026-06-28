from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import uuid
from database import get_db
from models import UserRegister, UserLogin, UserOut, Token
from security import get_password_hash, verify_password
from auth import create_access_token, get_current_user
from utils import format_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db=Depends(get_db)):
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_id = f"u{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(user_data.password)

    new_user = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password": hashed_password,
        "role": user_data.role.value,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }

    await db.users.insert_one(new_user)
    access_token = create_access_token(data={"sub": user_id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user(new_user),
    }


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["_id"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user(user),
    }


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return format_user(current_user)
