from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from routes import register_routes
from database import create_tables, get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import time
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
from pathlib import Path

# Load env from root directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

port = os.getenv("PORT", os.getenv("SNIPPETSTREAM_PORT", "8000"))

# Background task management
background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for background tasks"""
    
    # Startup
    print("🚀 Starting SnippetStream API with subscription management...")
    
    # Start subscription background task
    try:
        from subscription_manager import subscription_background_task
        task = asyncio.create_task(subscription_background_task())
        background_tasks.add(task)
        task.add_done_callback(background_tasks.discard)
        print("✅ Subscription background task started")
    except Exception as e:
        print(f"⚠️ Could not start subscription background task: {e}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down SnippetStream API...")
    
    # Cancel background tasks
    for task in background_tasks:
        task.cancel()
    
    # Wait for tasks to complete
    if background_tasks:
        await asyncio.gather(*background_tasks, return_exceptions=True)
        print("✅ Background tasks stopped")

app = FastAPI(
    title="SnippetStream API", 
    version="2.0.0",
    description="Transform long-form content into social media posts for X/Twitter, LinkedIn, and Instagram with user authentication and content management",
    lifespan=lifespan
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


# Database health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
        # Get database info
        try:
            from models import CustomTemplate, User
            total_templates = db.query(CustomTemplate).count()
            public_templates = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
            total_users = db.query(User).count()
            
            return {
                "status": "healthy",
                "database": "connected",
                "templates": {
                    "total": total_templates,
                    "public": public_templates
                },
                "users": total_users,
                "timestamp": time.time()
            }
        except Exception as model_error:
            # Fallback if models can't be imported
            return {
                "status": "healthy",
                "database": "connected",
                "error": f"Model import error: {str(model_error)}",
                "timestamp": time.time()
            }
            
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": time.time()
            }
        )

# Initialize database tables
try:
    create_tables()
    print("✅ Database tables initialized successfully")
    
    # Seed public templates if they don't exist
    try:
        from seed_public_templates import seed_public_templates
        seed_public_templates()
        print("✅ Public templates seeding completed")
    except Exception as seed_error:
        print(f"⚠️  Template seeding warning: {seed_error}")
        print("   Templates may already exist or there was a seeding issue")
        
except Exception as e:
    print(f"⚠️  Database initialization warning: {e}")
    print("   This is normal if using SQLite for the first time")

# Simple rate limiting middleware
request_times = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    current_time = time.time()
    
    # Skip rate limiting for health checks and static files
    if request.url.path in ["/health", "/docs", "/openapi.json"] or request.url.path.startswith("/static"):
        response = await call_next(request)
        return response
    
    # Clean old entries (older than 1 minute)
    if client_ip in request_times:
        request_times[client_ip] = [t for t in request_times[client_ip] if current_time - t < 60]
    else:
        request_times[client_ip] = []
    
    # Check rate limit (max 100 requests per minute for general API - increased for payment flows)
    # Higher limit for authenticated users (check Authorization header)
    auth_header = request.headers.get("Authorization")
    rate_limit = 200 if auth_header else 100
    
    if len(request_times[client_ip]) >= rate_limit:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down and try again in a minute."}
        )
    
    # Add current request time
    request_times[client_ip].append(current_time)
    
    response = await call_next(request)
    return response

# Add path-normalization middleware to handle double slashes, etc.
@app.middleware("http")
async def normalize_path_middleware(request: Request, call_next):
    # Get current path
    path = request.url.path
    
    # Check for multiple slashes (e.g., //api/v1/...)
    if "//" in path:
        import re
        normalized_path = re.sub(r'/+', '/', path)
        print(f"🔄 Normalizing path from {path} to {normalized_path}")
        
        # We can't easily change request.url.path directly in some FastAPI versions, 
        # but we can modify the scope
        request.scope["path"] = normalized_path
        
    response = await call_next(request)
    return response

# Configure CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)



# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

@app.get("/debug")
async def debug_endpoint():
    """Simple debug endpoint to test basic functionality"""
    try:
        import sys
        import os
        
        return {
            "status": "working",
            "python_version": sys.version,
            "environment_vars": {
                "DATABASE_URL": "SET" if os.getenv("DATABASE_URL") else "NOT SET",
                "SECRET_KEY": "SET" if os.getenv("SECRET_KEY") else "NOT SET"
            },
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SnippetStream API is running",
        "version": "2.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "debug": "/debug",
            "auth": "/api/v1/auth/*",
            "content": "/api/v1/content/*",
            "templates": "/api/v1/public/templates",
            "repurpose": "/api/v1/repurpose",
            "payment": "/api/v1/payment/*"
        }
    }

@app.get("/admin/seed-templates")
async def admin_seed_templates(db: Session = Depends(get_db)):
    """Admin endpoint to seed templates in production"""
    try:
        # Import here to avoid startup issues
        from seed_public_templates import seed_public_templates
        from models import CustomTemplate
        
        # Check current state
        existing_count = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
        
        if existing_count > 0:
            return {
                "status": "already_seeded",
                "message": f"Found {existing_count} existing public templates",
                "templates": existing_count
            }
        
        # Run seeding
        seed_public_templates()
        
        # Check result
        new_count = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
        
        return {
            "status": "success",
            "message": f"Seeded {new_count} public templates",
            "templates": new_count
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": str(e),
                "error": str(e),
                "traceback": error_details
            }
        )

register_routes(app)

# Export the app for Vercel
handler = app

# Only run uvicorn if this file is executed directly (not imported by Vercel)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(port))