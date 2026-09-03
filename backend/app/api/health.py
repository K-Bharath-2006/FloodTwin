import os
import shutil
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.config import settings

router = APIRouter(tags=["System Health & Observability"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Structured system health endpoint checking:
    - Database / PostGIS connectivity
    - Simulation solver paths
    - GEE configuration status
    - Local storage disk space
    """
    # 1. Database Check
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    # 2. Solvers Check
    delft3d_status = "CONFIGURED" if (settings.DELFT3D_EXECUTABLE and os.path.exists(settings.DELFT3D_EXECUTABLE)) else "NOT_CONFIGURED (Demo Reference Solver Active)"
    sph_status = "CONFIGURED" if (settings.SPH_EXECUTABLE and os.path.exists(settings.SPH_EXECUTABLE)) else "NOT_CONFIGURED (Demo Reference Solver Active)"
    gee_status = "CONFIGURED" if (settings.GEE_PROJECT and settings.GEE_SERVICE_ACCOUNT) else "NOT_CONFIGURED (Satellite Reference Baseline Active)"

    # 3. Disk Space Check
    total, used, free = shutil.disk_usage(os.path.abspath(settings.STORAGE_PATH))
    free_gb = round(free / (1024 ** 3), 2)

    return {
        "status": "HEALTHY" if db_status == "HEALTHY" else "DEGRADED",
        "service": "SIH 2026 Dam Break Hydrodynamic Platform Backend",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "solvers": {
            "delft3d_fm": delft3d_status,
            "dualsphysics_sph": sph_status,
            "reference_hydrodynamic_engine": "ACTIVE"
        },
        "satellite": {
            "google_earth_engine": gee_status
        },
        "storage": {
            "storage_path": os.path.abspath(settings.STORAGE_PATH),
            "free_space_gb": free_gb
        }
    }

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Kubernetes / Docker readiness probe."""
    try:
        db.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception:
        return {"ready": False}
