"""Authentication Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from services.auth import register_user, authenticate_user, create_token, get_current_user
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new user"""
    try:
        user = register_user(req.email, req.password, req.name)
        token = create_token(req.email)
        return {"token": token, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login and get token"""
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(req.email)
    return {"token": token, "user": user}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    return user
