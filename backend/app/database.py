import json
from typing import Generator, Any
from sqlalchemy import create_engine, TypeDecorator, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.config import settings

# Custom Geometry handling for cross-database compatibility (PostGIS & SQLite)
class GeometryJSON(TypeDecorator):
    """
    Stores geometry as GeoJSON text on SQLite or PostGIS geometry.
    Transparently converts GeoJSON dict <-> DB storage.
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Any, dialect) -> Any:
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        return str(value)

    def process_result_value(self, value: Any, dialect) -> Any:
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value

# Determine connect args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
