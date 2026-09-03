import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from backend.app.database import Base

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MODELLER = "MODELLER"
    VIEWER = "VIEWER"
    CITIZEN = "CITIZEN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CITIZEN, nullable=False)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    picture_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
