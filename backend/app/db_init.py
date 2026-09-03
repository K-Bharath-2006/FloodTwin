import logging
from backend.app.database import engine, Base
from backend.app.models import *

logger = logging.getLogger(__name__)

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables successfully initialized.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
