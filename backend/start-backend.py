#!/usr/bin/env python3
"""
Simple backend startup script with better error handling
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'jwt',
        'passlib',
        'requests',
        'pydantic'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("📦 Install them with: pip install -r requirements-minimal.txt")
        return False
    
    return True

def initialize_database():
    """Initialize database tables"""
    try:
        from database import create_tables
        create_tables()
        print("✅ Database tables initialized successfully")
        return True
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("   This is normal for first-time setup with SQLite")
        return True

def start_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        from main import app
        
        print("🚀 Starting SnippetStream Backend...")
        print("📡 Server will be available at: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        print("🔍 Health Check: http://localhost:8000/health")
        print("\n⏹️  Press Ctrl+C to stop the server\n")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔍 Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)
    
    print("🗄️  Initializing database...")
    if not initialize_database():
        sys.exit(1)
    
    # Start the server
    start_server()