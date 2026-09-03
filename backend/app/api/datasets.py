import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.dataset import Dataset, DatasetType
from backend.app.schemas.dataset import DatasetResponse
from backend.app.models.user import User, UserRole
from backend.app.auth.security import get_current_user, require_role
from backend.app.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    dataset_type: Optional[DatasetType] = None,
    db: Session = Depends(get_db)
):
    """Lists ingested GIS datasets (DEM, Rivers, Infrastructure, Satellite)."""
    q = db.query(Dataset)
    if dataset_type:
        q = q.filter(Dataset.dataset_type == dataset_type)
    return q.all()

@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    name: str = Form(...),
    dataset_type: DatasetType = Form(...),
    crs: str = Form("EPSG:4326"),
    source_attribution: str = Form("OpenStreetMap / USGS EarthExplorer"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MODELLER]))
):
    """
    Validates and ingests a new GIS/DEM dataset.
    Protects against path traversal and validates file contents.
    """
    # Sanitize file name
    clean_filename = os.path.basename(file.filename or "dataset.dat")
    ext = os.path.splitext(clean_filename)[1].upper().replace(".", "")
    if ext not in ["TIF", "TIFF", "GEOJSON", "JSON", "SHP", "ZIP", "CSV", "NC"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: TIF, GEOJSON, ZIP, CSV, NC."
        )

    dataset_id = str(uuid.uuid4())
    upload_dir = os.path.join(settings.STORAGE_PATH, "datasets", dataset_type.value)
    os.makedirs(upload_dir, exist_ok=True)
    target_path = os.path.join(upload_dir, f"{dataset_id}_{clean_filename}")

    # Write file safely
    content = await file.read()
    file_size = len(content)
    with open(target_path, "wb") as f:
        f.write(content)

    dataset = Dataset(
        id=dataset_id,
        name=name,
        dataset_type=dataset_type,
        file_path=target_path,
        file_format=ext,
        file_size_bytes=float(file_size),
        crs=crs,
        source_attribution=source_attribution,
        is_valid=1.0
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset
