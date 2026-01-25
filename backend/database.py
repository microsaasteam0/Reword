from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - fallback to SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./snippetstream.db")

# Handle PostgreSQL URL format for production
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with proper connection pooling and reconnection handling
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL/Neon configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Enables automatic reconnection
        pool_recycle=3600,   # Recycle connections every hour
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
            "application_name": "SnippetStream"
        }
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Enhanced dependency to get DB session with retry logic
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    from models import Base
    Base.metadata.create_all(bind=engine)