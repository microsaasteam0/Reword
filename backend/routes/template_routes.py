from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from auth import get_current_active_user
from models import User, CustomTemplate
from db_utils import db_retry
import json
from datetime import datetime
import time

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])

# Pydantic models for request/response
class CustomTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str  # 'blog', 'newsletter', 'marketing', 'social', 'other'
    content: str
    tags: Optional[str] = None
    is_public: bool = False

class CustomTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    is_public: Optional[bool] = None
    is_favorite: Optional[bool] = None

class CustomTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    content: str
    tags: Optional[str]
    is_public: bool
    usage_count: int
    is_favorite: bool
    created_at: datetime
    updated_at: Optional[datetime]
    user_id: int  # Added to identify template owner
    is_own_template: Optional[bool] = None  # Added to distinguish own vs public templates
    
    class Config:
        from_attributes = True

@db_retry(max_retries=3, delay=0.5)
def create_custom_template_db(db: Session, user_id: int, template_data: CustomTemplateCreate):
    """Create a new custom template"""
    db_template = CustomTemplate(
        user_id=user_id,
        name=template_data.name,
        description=template_data.description,
        category=template_data.category,
        content=template_data.content,
        tags=template_data.tags,
        is_public=template_data.is_public
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@db_retry(max_retries=3, delay=0.5)
def get_user_templates_db(db: Session, user_id: int, category: Optional[str] = None):
    """Get all templates for a user"""
    query = db.query(CustomTemplate).filter(CustomTemplate.user_id == user_id)
    if category:
        query = query.filter(CustomTemplate.category == category)
    return query.order_by(CustomTemplate.created_at.desc()).all()

@db_retry(max_retries=3, delay=0.5)
def get_public_templates_db(db: Session, category: Optional[str] = None, exclude_user_id: Optional[int] = None):
    """Get all public templates from other users"""
    query = db.query(CustomTemplate).filter(CustomTemplate.is_public == True)
    if category:
        query = query.filter(CustomTemplate.category == category)
    if exclude_user_id:
        query = query.filter(CustomTemplate.user_id != exclude_user_id)
    return query.order_by(CustomTemplate.usage_count.desc(), CustomTemplate.created_at.desc()).all()

@db_retry(max_retries=3, delay=0.5)
def get_all_accessible_templates_db(db: Session, user_id: int, category: Optional[str] = None):
    """Get all templates accessible to a user (their own + public templates from others)"""
    # Get user's own templates
    user_query = db.query(CustomTemplate).filter(CustomTemplate.user_id == user_id)
    if category:
        user_query = user_query.filter(CustomTemplate.category == category)
    
    # Get public templates from other users
    public_query = db.query(CustomTemplate).filter(
        CustomTemplate.is_public == True,
        CustomTemplate.user_id != user_id
    )
    if category:
        public_query = public_query.filter(CustomTemplate.category == category)
    
    # Combine results - user templates first, then public templates by popularity
    user_templates = user_query.order_by(CustomTemplate.created_at.desc()).all()
    public_templates = public_query.order_by(CustomTemplate.usage_count.desc(), CustomTemplate.created_at.desc()).all()
    
    return user_templates + public_templates

@db_retry(max_retries=3, delay=0.5)
def get_template_by_id_db(db: Session, template_id: int, user_id: int):
    """Get a specific template by ID (user's own or public template)"""
    # First try to get user's own template
    template = db.query(CustomTemplate).filter(
        CustomTemplate.id == template_id,
        CustomTemplate.user_id == user_id
    ).first()
    
    # If not found, try to get public template from other users
    if not template:
        template = db.query(CustomTemplate).filter(
            CustomTemplate.id == template_id,
            CustomTemplate.is_public == True,
            CustomTemplate.user_id != user_id
        ).first()
    
    return template

@db_retry(max_retries=3, delay=0.5)
def update_template_db(db: Session, template_id: int, user_id: int, template_data: CustomTemplateUpdate):
    """Update a custom template"""
    db_template = db.query(CustomTemplate).filter(
        CustomTemplate.id == template_id,
        CustomTemplate.user_id == user_id
    ).first()
    
    if not db_template:
        return None
    
    # Update fields if provided
    if template_data.name is not None:
        db_template.name = template_data.name
    if template_data.description is not None:
        db_template.description = template_data.description
    if template_data.category is not None:
        db_template.category = template_data.category
    if template_data.content is not None:
        db_template.content = template_data.content
    if template_data.tags is not None:
        db_template.tags = template_data.tags
    if template_data.is_public is not None:
        db_template.is_public = template_data.is_public
    if template_data.is_favorite is not None:
        db_template.is_favorite = template_data.is_favorite
    
    db.commit()
    db.refresh(db_template)
    return db_template

@db_retry(max_retries=3, delay=0.5)
def delete_template_db(db: Session, template_id: int, user_id: int):
    """Delete a custom template"""
    db_template = db.query(CustomTemplate).filter(
        CustomTemplate.id == template_id,
        CustomTemplate.user_id == user_id
    ).first()
    
    if not db_template:
        return False
    
    db.delete(db_template)
    db.commit()
    return True

@db_retry(max_retries=3, delay=0.5)
def increment_template_usage_db(db: Session, template_id: int, user_id: int):
    """Increment the usage count for a template (user's own or public template)"""
    # First try user's own template
    db_template = db.query(CustomTemplate).filter(
        CustomTemplate.id == template_id,
        CustomTemplate.user_id == user_id
    ).first()
    
    # If not found, try public template from other users
    if not db_template:
        db_template = db.query(CustomTemplate).filter(
            CustomTemplate.id == template_id,
            CustomTemplate.is_public == True,
            CustomTemplate.user_id != user_id
        ).first()
    
    if db_template:
        db_template.usage_count += 1
        db.commit()
        db.refresh(db_template)
    
    return db_template

# API Routes

@router.post("/", response_model=CustomTemplateResponse)
async def create_custom_template(
    template_data: CustomTemplateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new custom template - Pro feature"""
    from feature_gates import get_feature_gate
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_create_templates():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creating custom templates is a Pro feature. Upgrade to Pro to customize your workflow."
        )

    try:
        # Validate category
        valid_categories = ['blog', 'newsletter', 'marketing', 'social', 'other']
        if template_data.category not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        
        # Check if user already has a template with this name
        existing = db.query(CustomTemplate).filter(
            CustomTemplate.user_id == current_user.id,
            CustomTemplate.name == template_data.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a template with this name"
            )
        
        db_template = create_custom_template_db(db, current_user.id, template_data)
        return db_template
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating custom template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create custom template"
        )

@router.get("/", response_model=List[CustomTemplateResponse])
async def get_user_templates(
    category: Optional[str] = None,
    include_public: bool = True,  # New parameter to include public templates
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all custom templates accessible to the current user (own + public) - Premium feature"""
    from feature_gates import get_feature_gate
    
    # Check if user can access templates (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_use_advanced_templates():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "templates_restricted",
                "message": "Template browsing is only available for Pro users",
                "upgrade_required": True,
                "feature": "custom_templates"
            }
        )
    
    try:
        if include_public:
            templates = get_all_accessible_templates_db(db, current_user.id, category)
        else:
            templates = get_user_templates_db(db, current_user.id, category)
        
        # Add is_own_template flag to distinguish user's templates from public ones
        for template in templates:
            template.is_own_template = template.user_id == current_user.id
        
        return templates
        
    except Exception as e:
        print(f"Error fetching user templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch templates"
        )

@router.get("/{template_id}", response_model=CustomTemplateResponse)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific custom template - Premium feature"""
    from feature_gates import get_feature_gate
    
    # Check if user can access templates (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_use_advanced_templates():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "templates_restricted",
                "message": "Template access is only available for Pro users",
                "upgrade_required": True,
                "feature": "custom_templates"
            }
        )
    
    try:
        template = get_template_by_id_db(db, template_id, current_user.id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template"
        )

@router.put("/{template_id}", response_model=CustomTemplateResponse)
async def update_template(
    template_id: int,
    template_data: CustomTemplateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a custom template"""
    try:
        # Validate category if provided
        if template_data.category:
            valid_categories = ['blog', 'newsletter', 'marketing', 'social', 'other']
            if template_data.category not in valid_categories:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
                )
        
        # Check if name conflicts with existing template (if name is being updated)
        if template_data.name:
            existing = db.query(CustomTemplate).filter(
                CustomTemplate.user_id == current_user.id,
                CustomTemplate.name == template_data.name,
                CustomTemplate.id != template_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have a template with this name"
                )
        
        updated_template = update_template_db(db, template_id, current_user.id, template_data)
        if not updated_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return updated_template
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a custom template"""
    try:
        success = delete_template_db(db, template_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )

@router.post("/{template_id}/use", response_model=CustomTemplateResponse)
async def use_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Use a template (increments usage count and returns template content)"""
    try:
        template = increment_template_usage_db(db, template_id, current_user.id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error using template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to use template"
        )

@router.get("/test-public")
async def test_public_endpoint():
    """Test endpoint without authentication"""
    return {"message": "This endpoint works without authentication", "timestamp": time.time()}

@router.get("/test-no-auth")
async def test_no_auth():
    """Test endpoint with no authentication required"""
    return {
        "message": "This endpoint works without authentication",
        "timestamp": time.time(),
        "status": "success"
    }

@router.get("/debug-public")
async def debug_public_templates(db: Session = Depends(get_db)):
    """Debug endpoint to check raw public template data"""
    try:
        templates = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).limit(3).all()
        
        debug_data = []
        for template in templates:
            debug_data.append({
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "category": template.category,
                "content_length": len(template.content) if template.content else 0,
                "tags": template.tags,
                "is_public": template.is_public,
                "usage_count": template.usage_count,
                "is_favorite": template.is_favorite,
                "created_at": str(template.created_at),
                "updated_at": str(template.updated_at) if template.updated_at else None,
                "user_id": template.user_id,
                "has_null_fields": {
                    "name": template.name is None,
                    "category": template.category is None,
                    "content": template.content is None,
                    "is_public": template.is_public is None,
                    "usage_count": template.usage_count is None,
                    "is_favorite": template.is_favorite is None,
                    "created_at": template.created_at is None,
                    "user_id": template.user_id is None
                }
            })
        
        return {
            "total_public_templates": db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count(),
            "sample_templates": debug_data
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/test-public")
async def test_public_templates_endpoint():
    """Test endpoint to verify public templates functionality"""
    try:
        from database import get_db
        db = next(get_db())
        
        # Count public templates
        from models import CustomTemplate
        count = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
        
        # Get first template as sample
        sample = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).first()
        
        return {
            "message": "Public templates test endpoint working",
            "public_templates_count": count,
            "sample_template": {
                "id": sample.id if sample else None,
                "name": sample.name if sample else None,
                "category": sample.category if sample else None
            } if sample else None,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Test endpoint failed"
        }

@router.get("/public", response_model=List[CustomTemplateResponse])
async def get_public_templates(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all public templates from other users - Pro feature"""
    from feature_gates import get_feature_gate
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_browse_community_templates():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Browsing community templates is a Pro feature. Upgrade to Pro to see what others are creating."
        )

    try:
        print(f"🌐 Public templates endpoint called - category: {category}")
        
        # Get all public templates
        query = db.query(CustomTemplate).filter(CustomTemplate.is_public == True)
        if category:
            query = query.filter(CustomTemplate.category == category)
        
        templates = query.order_by(CustomTemplate.usage_count.desc(), CustomTemplate.created_at.desc()).all()
        
        print(f"📊 Found {len(templates)} public templates")
        
        if not templates:
            print("⚠️ No public templates found in database")
            return []
        
        # Convert to response format with proper field handling
        response_templates = []
        for template in templates:
            try:
                template_dict = {
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "content": template.content,
                    "tags": template.tags,
                    "is_public": template.is_public,
                    "usage_count": template.usage_count,
                    "is_favorite": False,  # Public templates are not favorites for browsing users
                    "created_at": template.created_at,
                    "updated_at": template.updated_at,
                    "user_id": template.user_id,
                    "is_own_template": False  # These are not the user's own templates
                }
                response_template = CustomTemplateResponse(**template_dict)
                response_templates.append(response_template)
                print(f"✅ Processed template: {template.name}")
            except Exception as template_error:
                print(f"❌ Error processing template {template.id}: {template_error}")
                continue
        
        print(f"✅ Returning {len(response_templates)} templates")
        return response_templates
        
    except Exception as e:
        print(f"❌ Error fetching public templates: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch public templates: {str(e)}"
        )

@router.get("/categories/list")
async def get_template_categories(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available template categories"""
    return {
        "categories": [
            {"value": "blog", "label": "Blog Post", "description": "Blog articles and posts"},
            {"value": "newsletter", "label": "Newsletter", "description": "Email newsletters and updates"},
            {"value": "marketing", "label": "Marketing", "description": "Marketing content and campaigns"},
            {"value": "social", "label": "Social Media", "description": "Social media posts and content"},
            {"value": "other", "label": "Other", "description": "Other types of content"}
        ]
    }