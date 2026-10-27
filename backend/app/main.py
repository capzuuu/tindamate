from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal, db_info
from app.seed import seed_products_if_empty
from app.routes import health, products, sales, analytics, utangs, expenses, settings as store_settings, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tindamate")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Connected using engine: {db_info['engine_type']}")

        # Ensure newly added columns exist in older database files
        with engine.connect() as conn:
            for sql in [
                "ALTER TABLE sales ADD COLUMN is_voided BOOLEAN DEFAULT 0",
                "ALTER TABLE products ADD COLUMN is_archived BOOLEAN DEFAULT 0",
                "ALTER TABLE products ADD COLUMN wholesale_price FLOAT DEFAULT NULL",
                "ALTER TABLE products ADD COLUMN min_wholesale_qty INT DEFAULT 12"
            ]:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                except Exception:
                    pass

        db = SessionLocal()
        try:
            seeded = seed_products_if_empty(db)
            if seeded:
                logger.info("Sample Sari-Sari store inventory seeded successfully!")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}")

    yield
    logger.info("Shutting down TindaMate API server...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for TindaMate - Store management app for Filipino sari-sari stores",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(utangs.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(store_settings.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "database": db_info["engine_type"],
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
