import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="DEVELOPMENT")
    DEBUG: bool = Field(default=True)
    LOG_LEVEL: str = Field(default="INFO")

    # API Prefix
    API_V1_PREFIX: str = Field(default="/api/v1")
    BACKEND_HOST: str = Field(default="0.0.0.0")
    BACKEND_PORT: int = Field(default=8000)

    # Security & Auth
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production-min-32-chars-long-secure")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)
    CORS_ORIGINS: List[str] = Field(default=["*"])

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./damflood_dev.db")
    DATABASE_ASYNC_URL: Optional[str] = None

    # Redis & Celery
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")

    # Storage Paths
    STORAGE_PATH: str = Field(default="./storage")
    SIMULATION_WORKSPACE_PATH: str = Field(default="./simulation_runs")

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None)
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None)

    # Firebase Cloud Messaging
    FIREBASE_PROJECT_ID: Optional[str] = Field(default=None)
    FIREBASE_CLIENT_EMAIL: Optional[str] = Field(default=None)
    FIREBASE_PRIVATE_KEY: Optional[str] = Field(default=None)

    # Delft3D-FM Solver Configuration
    DELFT3D_EXECUTABLE: Optional[str] = Field(default=None)
    DELFT3D_CONFIG: Optional[str] = Field(default=None)
    DELFT3D_WORKDIR: str = Field(default="./simulation_runs/delft3d")
    DELFT3D_TIMEOUT_SECONDS: int = Field(default=7200)

    # SPH (DualSPHysics) Solver Configuration
    SPH_EXECUTABLE: Optional[str] = Field(default=None)
    SPH_WORKDIR: str = Field(default="./simulation_runs/sph")
    SPH_TIMEOUT_SECONDS: int = Field(default=7200)

    # Google Earth Engine (GEE)
    GEE_PROJECT: Optional[str] = Field(default=None)
    GEE_SERVICE_ACCOUNT: Optional[str] = Field(default=None)
    GEE_PRIVATE_KEY_FILE: Optional[str] = Field(default=None)

    # Risk Thresholds
    RISK_LEVEL_1_DEPTH_THRESHOLD_M: float = Field(default=0.1)
    RISK_LEVEL_1_VELOCITY_THRESHOLD_MS: float = Field(default=0.2)
    RISK_LEVEL_2_DEPTH_THRESHOLD_M: float = Field(default=0.5)
    RISK_LEVEL_2_VELOCITY_THRESHOLD_MS: float = Field(default=1.0)
    RISK_LEVEL_3_DEPTH_THRESHOLD_M: float = Field(default=1.5)
    RISK_LEVEL_3_VELOCITY_THRESHOLD_MS: float = Field(default=2.5)
    RISK_LEVEL_3_ARRIVAL_TIME_MIN: float = Field(default=60.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
os.makedirs(settings.SIMULATION_WORKSPACE_PATH, exist_ok=True)
os.makedirs(settings.DELFT3D_WORKDIR, exist_ok=True)
os.makedirs(settings.SPH_WORKDIR, exist_ok=True)
