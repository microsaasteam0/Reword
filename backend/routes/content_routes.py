from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import json

from database import get_db
from auth import get_current_active_user, check_rate_limit
from models import User, ContentGeneration, SavedContent, UsageStats

content_router = APIRouter()

# Pydantic models
class SaveContentRequest(BaseModel):
    title: str
    content_type: str  # 'twitter', 'linkedin', 'instagram'
    content: str
    tags: Optional[str] = None

class SavedContentResponse(BaseModel):
    id: int
    title: str
    content_type: str
    content: str
    tags: Optional[str]
    is_favorite: bool
    created_at: str
    updated_at: Optional[str]

class ContentHistoryResponse(BaseModel):
    id: int
    original_content: str
    content_source: Optional[str]
    twitter_thread: Optional[str]
    linkedin_post: Optional[str]
    instagram_carousel: Optional[str]
    context: Optional[str]
    processing_time: Optional[float]
    created_at: str

class UpdateSavedContentRequest(BaseModel):
    title: Optional[str] = None
    tags: Optional[str] = None
    is_favorite: Optional[bool] = None

@content_router.post("/save", response_model=SavedContentResponse)
async def save_content(
    request: SaveContentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save generated content for later use"""
    from feature_gates import get_feature_gate
    
    # Check if user can save content (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_save_content():
        raise HTTPException(
            status_code=403,
            detail="Content saving is only available for premium users. Upgrade to Pro to save unlimited content."
        )
    
    try:
        saved_content = SavedContent(
            user_id=current_user.id,
            title=request.title,
            content_type=request.content_type,
            content=request.content,
            tags=request.tags
        )
        
        db.add(saved_content)
        db.commit()
        db.refresh(saved_content)
        
        # Track usage
        usage_stat = UsageStats(
            user_id=current_user.id,
            action="save_content",
            platform=request.content_type,
            extra_data=json.dumps({"title": request.title})
        )
        db.add(usage_stat)
        db.commit()
        
        return SavedContentResponse(
            id=saved_content.id,
            title=saved_content.title,
            content_type=saved_content.content_type,
            content=saved_content.content,
            tags=saved_content.tags,
            is_favorite=saved_content.is_favorite,
            created_at=saved_content.created_at.isoformat(),
            updated_at=saved_content.updated_at.isoformat() if saved_content.updated_at else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to save content"
        )

@content_router.get("/saved", response_model=List[SavedContentResponse])
async def get_saved_content(
    content_type: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's saved content"""
    from feature_gates import get_feature_gate
    
    # Check if user can access saved content (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_save_content():
        raise HTTPException(
            status_code=403,
            detail="Saved content access is only available for premium users. Upgrade to Pro to save and access unlimited content."
        )
    query = db.query(SavedContent).filter(SavedContent.user_id == current_user.id)
    
    if content_type:
        query = query.filter(SavedContent.content_type == content_type)
    
    if is_favorite is not None:
        query = query.filter(SavedContent.is_favorite == is_favorite)
    
    saved_content = query.order_by(SavedContent.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        SavedContentResponse(
            id=content.id,
            title=content.title,
            content_type=content.content_type,
            content=content.content,
            tags=content.tags,
            is_favorite=content.is_favorite,
            created_at=content.created_at.isoformat(),
            updated_at=content.updated_at.isoformat() if content.updated_at else None
        )
        for content in saved_content
    ]

@content_router.put("/saved/{content_id}", response_model=SavedContentResponse)
async def update_saved_content(
    content_id: int,
    request: UpdateSavedContentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update saved content"""
    from feature_gates import get_feature_gate
    
    # Check if user can save content (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_save_content():
        raise HTTPException(
            status_code=403,
            detail="Content saving features are only available for premium users."
        )
    saved_content = db.query(SavedContent).filter(
        SavedContent.id == content_id,
        SavedContent.user_id == current_user.id
    ).first()
    
    if not saved_content:
        raise HTTPException(
            status_code=404,
            detail="Saved content not found"
        )
    
    if request.title is not None:
        saved_content.title = request.title
    if request.tags is not None:
        saved_content.tags = request.tags
    if request.is_favorite is not None:
        saved_content.is_favorite = request.is_favorite
    
    saved_content.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(saved_content)
    
    return SavedContentResponse(
        id=saved_content.id,
        title=saved_content.title,
        content_type=saved_content.content_type,
        content=saved_content.content,
        tags=saved_content.tags,
        is_favorite=saved_content.is_favorite,
        created_at=saved_content.created_at.isoformat(),
        updated_at=saved_content.updated_at.isoformat() if saved_content.updated_at else None
    )

@content_router.delete("/saved/{content_id}")
async def delete_saved_content(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete saved content"""
    from feature_gates import get_feature_gate
    
    # Check if user can save content (premium only)
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_save_content():
        raise HTTPException(
            status_code=403,
            detail="Content saving features are only available for premium users."
        )
    saved_content = db.query(SavedContent).filter(
        SavedContent.id == content_id,
        SavedContent.user_id == current_user.id
    ).first()
    
    if not saved_content:
        raise HTTPException(
            status_code=404,
            detail="Saved content not found"
        )
    
    db.delete(saved_content)
    db.commit()
    
    return {"message": "Content deleted successfully"}

@content_router.get("/history", response_model=List[ContentHistoryResponse])
async def get_content_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's content generation history"""
    from feature_gates import get_feature_gate
    feature_gate = get_feature_gate(current_user)
    tier_limit = feature_gate.get_history_limit()
    
    # Use the smaller of requested limit and tier limit
    effective_limit = min(limit, tier_limit)
    
    history = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id
    ).order_by(ContentGeneration.created_at.desc()).offset(offset).limit(effective_limit).all()
    
    return [
        ContentHistoryResponse(
            id=item.id,
            original_content=item.original_content[:200] + "..." if len(item.original_content) > 200 else item.original_content,
            content_source=item.content_source,
            twitter_thread=item.twitter_thread,
            linkedin_post=item.linkedin_post,
            instagram_carousel=item.instagram_carousel,
            context=item.context,
            processing_time=item.processing_time,
            created_at=item.created_at.isoformat()
        )
        for item in history
    ]

@content_router.get("/history/{generation_id}", response_model=ContentHistoryResponse)
async def get_content_generation(
    generation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific content generation"""
    generation = db.query(ContentGeneration).filter(
        ContentGeneration.id == generation_id,
        ContentGeneration.user_id == current_user.id
    ).first()
    
    if not generation:
        raise HTTPException(
            status_code=404,
            detail="Content generation not found"
        )
    
    return ContentHistoryResponse(
        id=generation.id,
        original_content=generation.original_content,
        content_source=generation.content_source,
        twitter_thread=generation.twitter_thread,
        linkedin_post=generation.linkedin_post,
        instagram_carousel=generation.instagram_carousel,
        context=generation.context,
        processing_time=generation.processing_time,
        created_at=generation.created_at.isoformat()
    )

@content_router.get("/templates")
async def get_content_templates():
    """Get content templates for different industries/use cases"""
    templates = {
        "business": [
            {
                "title": "Product Launch Announcement",
                "description": "Template for announcing new products or services",
                "content": "🚀 Exciting news! We're thrilled to announce the launch of [Product Name]. After months of development, we're ready to share something that will [benefit/solution]. Here's what makes it special: [key features]. Available now at [link]. #ProductLaunch #Innovation"
            },
            {
                "title": "Company Milestone",
                "description": "Template for celebrating company achievements",
                "content": "🎉 We've reached an incredible milestone! [Achievement details]. This wouldn't have been possible without our amazing team and loyal customers. Thank you for being part of our journey. Here's to the next chapter! #Milestone #Gratitude #Growth"
            }
        ],
        "personal": [
            {
                "title": "Learning Journey",
                "description": "Template for sharing learning experiences",
                "content": "📚 Today I learned something valuable about [topic]. The key insight was [main learning]. This changes how I think about [application]. If you're interested in [topic], here are my top 3 takeaways: [list]. What's your experience with this? #Learning #Growth"
            },
            {
                "title": "Behind the Scenes",
                "description": "Template for sharing work process or daily routine",
                "content": "🎬 Behind the scenes of [project/day]. Most people see the final result, but here's what actually goes into [process]. The biggest challenge was [challenge] and here's how I solved it: [solution]. The lesson? [key insight]. #BehindTheScenes #Process"
            }
        ],
        "educational": [
            {
                "title": "How-To Guide",
                "description": "Template for educational content",
                "content": "💡 How to [skill/task] in [timeframe]: Step 1: [action] Step 2: [action] Step 3: [action] Pro tip: [bonus advice] The most common mistake people make is [mistake]. Avoid this by [solution]. Try it and let me know your results! #HowTo #Tips #Education"
            },
            {
                "title": "Industry Insights",
                "description": "Template for sharing industry knowledge",
                "content": "🔍 [Industry] is changing rapidly. Here are 3 trends I'm watching: 1. [Trend 1] - [impact] 2. [Trend 2] - [impact] 3. [Trend 3] - [impact] What does this mean for [audience]? [implications]. Which trend interests you most? #Industry #Trends #Insights"
            }
        ]
    }
    
    return templates

@content_router.get("/analytics")
async def get_content_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's content analytics"""
    from feature_gates import get_feature_gate
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_access_analytics():
        raise HTTPException(
            status_code=403,
            detail="Analytics dashboard is a Pro feature. Upgrade to Pro to track your content performance."
        )

    from datetime import timedelta
    # Get analytics for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Content generation stats
    total_generations = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id
    ).count()
    
    recent_generations = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id,
        ContentGeneration.created_at >= thirty_days_ago
    ).count()
    
    # Platform breakdown
    platform_stats = {}
    for platform in ['twitter', 'linkedin', 'instagram']:
        count = db.query(UsageStats).filter(
            UsageStats.user_id == current_user.id,
            UsageStats.platform == platform,
            UsageStats.action == 'copy',
            UsageStats.created_at >= thirty_days_ago
        ).count()
        platform_stats[platform] = count
    
    # Saved content stats
    saved_count = db.query(SavedContent).filter(
        SavedContent.user_id == current_user.id
    ).count()
    
    favorites_count = db.query(SavedContent).filter(
        SavedContent.user_id == current_user.id,
        SavedContent.is_favorite == True
    ).count()
    
    return {
        "total_generations": total_generations,
        "recent_generations": recent_generations,
        "platform_usage": platform_stats,
        "saved_content": saved_count,
        "favorites": favorites_count,
        "account_age_days": (datetime.now(timezone.utc) - current_user.created_at).days
    }