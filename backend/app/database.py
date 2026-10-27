import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("tindamate.database")

Base = declarative_base()

# State holder for database connectivity
db_info = {
    "engine_type": "mysql",
    "is_connected": False,
    "active_url": settings.computed_db_url,
    "error": None
}

def init_engine():
    target_url = settings.computed_db_url
    logger.info(f"Attempting connection to MySQL: {target_url}")
    
    try:
        # Create MySQL engine with connection pool
        mysql_engine = create_engine(
            target_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 5}
        )
        # Test connection immediately
        with mysql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        logger.info("Successfully connected to MySQL database!")
        db_info["engine_type"] = "mysql"
        db_info["is_connected"] = True
        db_info["active_url"] = target_url
        db_info["error"] = None
        return mysql_engine

    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Failed to connect to MySQL database: {err_msg}")
        db_info["error"] = err_msg
        
        if settings.DB_FALLBACK_SQLITE:
            sqlite_url = "sqlite:///./tindamate_dev.db"
            logger.warning(f"Falling back to local SQLite database: {sqlite_url}")
            sqlite_engine = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False}
            )
            db_info["engine_type"] = "sqlite"
            db_info["is_connected"] = True
            db_info["active_url"] = sqlite_url
            return sqlite_engine
        else:
            db_info["is_connected"] = False
            raise e

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "engine": db_info["engine_type"],
            "connected": True,
            "url": db_info["active_url"].split("@")[-1] if "@" in db_info["active_url"] else db_info["active_url"],
            "warning": None if db_info["engine_type"] == "mysql" else "Running in SQLite development fallback. Start MySQL to switch to production DB."
        }
    except Exception as err:
        return {
            "status": "unhealthy",
            "engine": db_info["engine_type"],
            "connected": False,
            "error": str(err)
        }
