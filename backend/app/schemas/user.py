from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.user import UserRole

class UserBase(BaseModel):
    email: str = Field(..., example="user@damflood.gov.in")
    full_name: Optional[str] = None
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    password: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    id_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(UserBase):
    id: str
    picture_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
