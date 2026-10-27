"""
TindaMate Database Initializer
Creates the MySQL database (if not exists), tables, and seeds initial products.
"""
import sys
import pymysql
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seed import seed_products_if_empty
from app import models

def create_mysql_database_if_not_exists():
    print(f"Connecting to MySQL server at {settings.DB_HOST}:{settings.DB_PORT} as '{settings.DB_USER}'...")
    try:
        conn = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            charset="utf8mb4",
            connect_timeout=3
        )
        with conn.cursor() as cursor:
            print(f"Ensuring database '{settings.DB_NAME}' exists...")
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        conn.close()
        print(f"[OK] Database '{settings.DB_NAME}' is ready!")
        return True
    except Exception as e:
        print(f"[WARN] Could not connect directly to MySQL server: {e}")
        print("Note: If MySQL / XAMPP is not running yet, the backend will use the local SQLite fallback.")
        return False

def init_tables_and_seed():
    if "--drop" in sys.argv or "--reset" in sys.argv:
        print("Dropping existing tables to apply new schema...")
        Base.metadata.drop_all(bind=engine)
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created successfully.")

    db = SessionLocal()
    try:
        seeded = seed_products_if_empty(db)
        if seeded:
            print("[OK] Sample sari-sari store products seeded!")
        else:
            print("[INFO] Database already contains products.")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("       TindaMate Database Initialization Script       ")
    print("=" * 60)
    create_mysql_database_if_not_exists()
    init_tables_and_seed()
    print("=" * 60)
    print("Database setup complete! You can now start the FastAPI server.")
    print("=" * 60)
