from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pydantic import EmailStr
from typing import Optional
from datetime import timedelta
import re
import os
import requests

from database import get_db
from auth import (
    authenticate_user, create_access_token, create_refresh_token,
    get_current_user, get_current_active_user, create_user,
    get_user_by_email, get_user_by_username, verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, verify_google_token, create_google_user,
    get_user_by_google_id, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
)
from models import User
from feature_gates import get_feature_gate
from email_service import email_service
from fastapi import BackgroundTasks

auth_router = APIRouter()

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: str

class Token(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse

class TokenRefresh(BaseModel):
    refresh_token: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class GoogleAuthRequest(BaseModel):
    token: str

class UserPreferencesUpdate(BaseModel):
    auto_save_enabled: Optional[bool] = None
    email_notifications_enabled: Optional[bool] = None

class UserPreferencesResponse(BaseModel):
    auto_save_enabled: bool
    email_notifications_enabled: bool

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None

def validate_password(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Za-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

def validate_username(username: str) -> bool:
    """Validate username format"""
    if len(username) < 3 or len(username) > 20:
        return False
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return False
    return True

@auth_router.post("/google/callback")
async def google_oauth_callback(
    code: str = Form(...),
    state: str = Form(...),
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback with authorization code"""
    try:
        print(f"🔄 Google OAuth callback received with code: {code[:20]}...")
        
        # Check if this code has been used recently (prevent duplicate processing)
        # This is a simple in-memory cache - in production, use Redis
        import time
        current_time = time.time()
        
        # Simple rate limiting per code (store in a global dict for demo)
        if not hasattr(google_oauth_callback, 'used_codes'):
            google_oauth_callback.used_codes = {}
        
        # Clean old codes (older than 10 minutes)
        google_oauth_callback.used_codes = {
            k: v for k, v in google_oauth_callback.used_codes.items() 
            if current_time - v < 600
        }
        
        # Check if code was recently used
        if code in google_oauth_callback.used_codes:
            print(f"⚠️  OAuth code already used recently, rejecting duplicate request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code has already been used"
            )
        
        # Mark code as used
        google_oauth_callback.used_codes[code] = current_time
        
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/auth/google/callback"
        
        print(f"🔍 Using redirect_uri: {redirect_uri}")
        
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        token_response = requests.post(token_url, data=token_data)
        
        if not token_response.ok:
            print(f"❌ Token exchange failed: {token_response.text}")
            # Remove code from used list if it failed (might be a different issue)
            google_oauth_callback.used_codes.pop(code, None)
            
            # Provide more specific error messages
            error_data = token_response.json() if token_response.headers.get('content-type', '').startswith('application/json') else {}
            error_type = error_data.get('error', 'unknown_error')
            
            if error_type == 'invalid_grant':
                detail = "Authorization code has expired or been used already. Please try signing in again."
            elif error_type == 'invalid_client':
                detail = "OAuth client configuration error. Please contact support."
            else:
                detail = f"Failed to exchange authorization code: {error_data.get('error_description', 'Unknown error')}"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail
            )
        
        tokens = token_response.json()
        id_token_str = tokens.get("id_token")
        
        if not id_token_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No ID token received from Google"
            )
        
        # Verify the ID token and get user info
        google_info = await verify_google_token(id_token_str)
        print(f"✅ Google token verified for user: {google_info['email']}")
        
        # Check if user already exists by Google ID
        user = get_user_by_google_id(db, google_info['google_id'])
        
        if not user:
            print(f"🔍 User not found by Google ID, checking by email: {google_info['email']}")
            # Check if user exists by email (linking accounts)
            user = get_user_by_email(db, google_info['email'])
            if user:
                print(f"🔗 Linking Google account to existing user: {user.email}")
                # Link Google account to existing user
                user.google_id = google_info['google_id']
                
                # Only update profile picture if it's still a Google profile picture or empty
                current_pic = user.profile_picture or ""
                is_google_pic = (
                    not current_pic or 
                    'googleusercontent.com' in current_pic or 
                    'lh3.googleusercontent.com' in current_pic or
                    'lh4.googleusercontent.com' in current_pic or
                    'lh5.googleusercontent.com' in current_pic or
                    'lh6.googleusercontent.com' in current_pic
                )
                
                if is_google_pic:
                    print(f"🖼️ Setting Google profile picture during account linking: {google_info['picture']}")
                    user.profile_picture = google_info['picture']
                else:
                    print(f"🖼️ Preserving existing custom profile picture during account linking: {current_pic}")
                
                user.is_verified = google_info['email_verified']
                if not user.full_name and google_info['name']:
                    user.full_name = google_info['name']
                db.commit()
                db.refresh(user)
            else:
                print(f"👤 Creating new user from Google info: {google_info['email']}")
                # Create new user from Google info
                user = create_google_user(db, google_info)
        else:
            print(f"🔄 Updating existing Google user: {user.email}")
            # Update existing Google user info (but preserve user customizations)
            
            # Only update profile picture if it's still a Google profile picture
            current_pic = user.profile_picture or ""
            is_google_pic = (
                not current_pic or 
                'googleusercontent.com' in current_pic or 
                'lh3.googleusercontent.com' in current_pic or
                'lh4.googleusercontent.com' in current_pic or
                'lh5.googleusercontent.com' in current_pic or
                'lh6.googleusercontent.com' in current_pic
            )
            
            if is_google_pic:
                print(f"🖼️ Updating Google profile picture: {google_info['picture']}")
                user.profile_picture = google_info['picture']
            else:
                print(f"🖼️ Preserving user's custom profile picture: {current_pic}")
            
            user.is_verified = google_info['email_verified']
            if not user.full_name and google_info['name']:
                user.full_name = google_info['name']
            db.commit()
            db.refresh(user)
        
        print(f"🔑 Creating tokens for user: {user.email}")
        # Create tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        print(f"✅ Google OAuth successful for user: {user.email}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                profile_picture=user.profile_picture,
                is_active=user.is_active,
                is_verified=user.is_verified,
                is_premium=user.is_premium,
                created_at=user.created_at.isoformat()
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Google OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth failed: {str(e)}"
        )

@auth_router.post("/google", response_model=Token)
async def google_auth(google_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    try:
        print(f"🔄 Google auth request received with token: {google_data.token[:50]}...")
        
        # Verify Google token and get user info
        google_info = await verify_google_token(google_data.token)
        print(f"✅ Google token verified for user: {google_info['email']}")
        
        # Check if user already exists by Google ID
        user = get_user_by_google_id(db, google_info['google_id'])
        
        if not user:
            print(f"🔍 User not found by Google ID, checking by email: {google_info['email']}")
            # Check if user exists by email (linking accounts)
            user = get_user_by_email(db, google_info['email'])
            if user:
                print(f"🔗 Linking Google account to existing user: {user.email}")
                # Link Google account to existing user
                user.google_id = google_info['google_id']
                
                # Only update profile picture if it's still a Google profile picture or empty
                current_pic = user.profile_picture or ""
                is_google_pic = (
                    not current_pic or 
                    'googleusercontent.com' in current_pic or 
                    'lh3.googleusercontent.com' in current_pic or
                    'lh4.googleusercontent.com' in current_pic or
                    'lh5.googleusercontent.com' in current_pic or
                    'lh6.googleusercontent.com' in current_pic
                )
                
                if is_google_pic:
                    print(f"🖼️ Setting Google profile picture during account linking: {google_info['picture']}")
                    user.profile_picture = google_info['picture']
                else:
                    print(f"🖼️ Preserving existing custom profile picture during account linking: {current_pic}")
                
                user.is_verified = google_info['email_verified']
                if not user.full_name and google_info['name']:
                    user.full_name = google_info['name']
                db.commit()
                db.refresh(user)
            else:
                print(f"👤 Creating new user from Google info: {google_info['email']}")
                # Create new user from Google info
                user = create_google_user(db, google_info)
        else:
            print(f"🔄 Updating existing Google user: {user.email}")
            # Update existing Google user info (but preserve user customizations)
            
            # Only update profile picture if it's still a Google profile picture
            # Google profile pictures contain 'googleusercontent.com' or 'lh3.googleusercontent.com'
            current_pic = user.profile_picture or ""
            is_google_pic = (
                not current_pic or 
                'googleusercontent.com' in current_pic or 
                'lh3.googleusercontent.com' in current_pic or
                'lh4.googleusercontent.com' in current_pic or
                'lh5.googleusercontent.com' in current_pic or
                'lh6.googleusercontent.com' in current_pic
            )
            
            if is_google_pic:
                print(f"🖼️ Updating Google profile picture: {google_info['picture']}")
                user.profile_picture = google_info['picture']
            else:
                print(f"🖼️ Preserving user's custom profile picture: {current_pic}")
            
            # Always update email verification status
            user.is_verified = google_info['email_verified']
            
            # Only update full name if user hasn't set one
            if not user.full_name and google_info['name']:
                user.full_name = google_info['name']
            
            db.commit()
            db.refresh(user)
        
        if not user.is_active:
            print(f"❌ User account is deactivated: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        print(f"🔑 Creating tokens for user: {user.email}")
        # Create tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            profile_picture=user.profile_picture,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_premium=user.is_premium,
            created_at=user.created_at.isoformat()
        )
        
        print(f"✅ Google auth successful for user: {user.email}")
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Google auth error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to authenticate with Google"
        )

@auth_router.post("/register", response_model=Token)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Validate input
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 characters and contain only letters, numbers, and underscores"
        )
    
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters with letters and numbers"
        )
    
    # Check if user already exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create user
    try:
        user = create_user(
            db=db,
            email=user_data.email,
            username=user_data.username,
            password=user_data.password,
            full_name=user_data.full_name
        )
        
        # Send verification email in background
        if user.verification_token:
            background_tasks.add_task(
                email_service.send_verification_email,
                user.email,
                user.username,
                user.verification_token
            )
        
        # Prepare response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            profile_picture=user.profile_picture,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_premium=user.is_premium,
            created_at=user.created_at.isoformat()
        )
        
        # Local users must verify before getting tokens
        if not user.is_verified and user.auth_provider == 'local':
            return Token(
                access_token=None,
                refresh_token=None,
                user=user_response
            )
            
        # Create tokens for verified users/OAuth
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_response
        )
        
    except Exception as e:
        print(f"❌ Error in register: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create user account"
        )

@auth_router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Enforce email verification for local (manual) users
    if not user.is_verified and user.auth_provider == 'local':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in. Check your inbox for the verification link."
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        profile_picture=user.profile_picture,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_premium=user.is_premium,
        created_at=user.created_at.isoformat()
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_response
    )

@auth_router.post("/refresh", response_model=dict)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token"""
    email = verify_token(token_data.refresh_token, "refresh")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        profile_picture=current_user.profile_picture,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_premium=current_user.is_premium,
        created_at=current_user.created_at.isoformat()
    )

@auth_router.post("/logout")
async def logout():
    """Logout user (client should remove tokens)"""
    return {"message": "Successfully logged out"}

@auth_router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    
    print(f"🔄 Profile update request for user: {current_user.email}")
    print(f"📝 Update data: username={profile_data.username}, full_name={profile_data.full_name}, profile_picture={profile_data.profile_picture}")
    
    # Validate username if provided
    if profile_data.username is not None:
        if not validate_username(profile_data.username):
            print(f"❌ Invalid username format: {profile_data.username}")
            raise HTTPException(
                status_code=400,
                detail="Username must be 3-20 characters and contain only letters, numbers, and underscores"
            )
        
        # Check if username is already taken by another user
        existing_user = get_user_by_username(db, profile_data.username)
        if existing_user and existing_user.id != current_user.id:
            print(f"❌ Username already taken: {profile_data.username}")
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        print(f"✅ Updating username from {current_user.username} to {profile_data.username}")
        current_user.username = profile_data.username
    
    # Update full name if provided
    if profile_data.full_name is not None:
        print(f"✅ Updating full_name from {current_user.full_name} to {profile_data.full_name}")
        current_user.full_name = profile_data.full_name
    
    # Update profile picture if provided
    if profile_data.profile_picture is not None:
        print(f"✅ Updating profile_picture from {current_user.profile_picture} to {profile_data.profile_picture}")
        current_user.profile_picture = profile_data.profile_picture
    
    try:
        db.commit()
        db.refresh(current_user)
        
        print(f"✅ Profile updated successfully for user: {current_user.email}")
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            full_name=current_user.full_name,
            profile_picture=current_user.profile_picture,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            is_premium=current_user.is_premium,
            created_at=current_user.created_at.isoformat()
        )
        
    except Exception as e:
        print(f"❌ Database error during profile update: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update profile"
        )

@auth_router.get("/usage-stats")
async def get_usage_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user usage statistics"""
    from models import UsageStats, ContentGeneration
    from datetime import datetime, timedelta, timezone
    
    # Get usage stats for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    total_generations = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id
    ).count()
    
    recent_generations = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id,
        ContentGeneration.created_at >= thirty_days_ago
    ).count()
    
    # Rate limit info - 24 hour window for free users only
    if current_user.is_premium:
        # Premium users have unlimited access
        rate_limit = -1  # -1 indicates unlimited
        remaining_requests = -1  # -1 indicates unlimited
    else:
        # Free users have daily limits
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_usage = db.query(UsageStats).filter(
            UsageStats.user_id == current_user.id,
            UsageStats.action == "generate",
            UsageStats.created_at >= twenty_four_hours_ago
        ).count()
        
        rate_limit = 2  # Free users get 2 per day
        remaining_requests = max(0, rate_limit - recent_usage)
    
    return {
        "total_generations": total_generations,
        "recent_generations": recent_generations,
        "rate_limit": rate_limit,
        "remaining_requests": remaining_requests,
        "is_premium": current_user.is_premium,
        "reset_period_hours": 24
    }

@auth_router.get("/feature-limits")
async def get_feature_limits(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's feature limits and capabilities"""
    feature_gate = get_feature_gate(current_user)
    return feature_gate.get_feature_limits(db)

@auth_router.get("/upgrade-prompt/{feature}")
async def get_upgrade_prompt(
    feature: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get upgrade prompt for specific feature"""
    feature_gate = get_feature_gate(current_user)
    return feature_gate.get_upgrade_prompt(feature)

@auth_router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_active_user)
):
    """Get user preferences"""
    return UserPreferencesResponse(
        auto_save_enabled=getattr(current_user, 'auto_save_enabled', True),
        email_notifications_enabled=getattr(current_user, 'email_notifications_enabled', True)
    )

@auth_router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    
    print(f"🔄 Preferences update request for user: {current_user.email}")
    print(f"📝 Update data: {preferences_data}")
    
    # Update preferences if provided
    if preferences_data.auto_save_enabled is not None:
        print(f"✅ Updating auto_save_enabled to {preferences_data.auto_save_enabled}")
        current_user.auto_save_enabled = preferences_data.auto_save_enabled
    
    if preferences_data.email_notifications_enabled is not None:
        print(f"✅ Updating email_notifications_enabled to {preferences_data.email_notifications_enabled}")
        current_user.email_notifications_enabled = preferences_data.email_notifications_enabled
    
    try:
        db.commit()
        db.refresh(current_user)
        
        print(f"✅ Preferences updated successfully for user: {current_user.email}")
        
        return UserPreferencesResponse(
            auto_save_enabled=getattr(current_user, 'auto_save_enabled', True),
            email_notifications_enabled=getattr(current_user, 'email_notifications_enabled', True)
        )
        
    except Exception as e:
        print(f"❌ Database error during preferences update: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update preferences"
        )

@auth_router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user's email with token"""
    token = token.strip()
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        # Link might be old or already used
        raise HTTPException(
            status_code=400, 
            detail="This verification link is invalid or has already been used. Please try logging in to check your status."
        )
    
    if user.is_verified:
        # Clear token even if already verified to prevent re-use
        user.verification_token = None
        db.commit()
        return {"success": True, "message": "Email is already verified"}
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"success": True, "message": "Email successfully verified"}

@auth_router.post("/resend-verification")
async def resend_verification(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Resend verification email"""
    if current_user.is_verified:
        return {"success": True, "message": "Email already verified"}
    
    # Generate new token if missing
    if not current_user.verification_token:
        import secrets
        current_user.verification_token = secrets.token_hex(32)
        db.commit()
        db.refresh(current_user)
    
    # Send verification email in background
    background_tasks.add_task(
        email_service.send_verification_email,
        current_user.email,
        current_user.username,
        current_user.verification_token
    )
    
    return {"success": True, "message": "Verification email has been resent"}
